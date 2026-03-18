import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    const body = await req.json();
    const { action, amount, company_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, months } = body;

    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET secrets.');
    }

    if (action === 'create_order') {
      const amountInPaise = Math.round(amount * 100);
      
      const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `wallet_${company_id}_${Date.now()}`,
          notes: { company_id, user_id: user.id },
        }),
      });

      if (!orderRes.ok) {
        const errBody = await orderRes.text();
        throw new Error(`Razorpay order creation failed: ${errBody}`);
      }

      const order = await orderRes.json();

      await supabaseClient.from('wallet_transactions').insert({
        company_id,
        amount,
        type: 'credit',
        description: `Wallet recharge — ₹${amount.toLocaleString()}`,
        razorpay_order_id: order.id,
        status: 'pending',
        created_by: user.id,
      });

      return new Response(JSON.stringify({ 
        order_id: order.id, 
        amount: order.amount, 
        currency: order.currency,
        key_id: RAZORPAY_KEY_ID,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'verify_payment') {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(RAZORPAY_KEY_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signatureData = `${razorpay_order_id}|${razorpay_payment_id}`;
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signatureData));
      const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (expectedSignature !== razorpay_signature) {
        await supabaseClient
          .from('wallet_transactions')
          .update({ status: 'failed' })
          .eq('razorpay_order_id', razorpay_order_id);
        
        throw new Error('Payment signature verification failed');
      }

      const { data: txn } = await supabaseClient
        .from('wallet_transactions')
        .update({ 
          status: 'completed', 
          razorpay_payment_id,
        })
        .eq('razorpay_order_id', razorpay_order_id)
        .select('amount')
        .single();

      if (!txn) throw new Error('Transaction not found');

      const { data: company } = await supabaseClient
        .from('companies')
        .select('wallet_balance')
        .eq('id', company_id)
        .single();

      const newBalance = (company?.wallet_balance || 0) + Number(txn.amount);

      await supabaseClient
        .from('companies')
        .update({ wallet_balance: newBalance })
        .eq('id', company_id);

      return new Response(JSON.stringify({ 
        success: true, 
        new_balance: newBalance,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'purchase_licenses') {
      // Prorated license purchase: charge only for remaining days until expiry
      const { data: company } = await supabaseClient
        .from('companies')
        .select('wallet_balance, license_limit, price_per_license, plan_expires_at, plan')
        .eq('id', company_id)
        .single();

      if (!company) throw new Error('Company not found');

      const seatsRequested = amount;
      const pricePerSeat = company.price_per_license || 500;
      const expiresAt = company.plan_expires_at ? new Date(company.plan_expires_at) : null;
      const now = new Date();

      if (!expiresAt || expiresAt <= now) {
        throw new Error('Your subscription has expired. Please extend your subscription first.');
      }

      // Calculate remaining days and prorate
      const totalDaysInMonth = 30;
      const remainingMs = expiresAt.getTime() - now.getTime();
      const remainingDays = Math.max(1, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
      const proratedCostPerSeat = Math.round((pricePerSeat / totalDaysInMonth) * remainingDays);
      const totalCost = seatsRequested * proratedCostPerSeat;
      
      if ((company.wallet_balance || 0) < totalCost) {
        throw new Error(`Insufficient wallet balance. Need ₹${totalCost.toLocaleString()} (prorated for ${remainingDays} days) but have ₹${(company.wallet_balance || 0).toLocaleString()}`);
      }

      const newBalance = (company.wallet_balance || 0) - totalCost;
      const newLicenseLimit = (company.license_limit || 0) + seatsRequested;

      await supabaseClient.from('wallet_transactions').insert({
        company_id,
        amount: totalCost,
        type: 'debit',
        description: `Purchased ${seatsRequested} license(s) — ₹${proratedCostPerSeat}/seat prorated for ${remainingDays} days`,
        status: 'completed',
        created_by: user.id,
      });

      await supabaseClient
        .from('companies')
        .update({ 
          wallet_balance: newBalance,
          license_limit: newLicenseLimit,
        })
        .eq('id', company_id);

      return new Response(JSON.stringify({ 
        success: true, 
        new_balance: newBalance,
        new_license_limit: newLicenseLimit,
        prorated_cost: totalCost,
        remaining_days: remainingDays,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'extend_subscription') {
      // Extend subscription by N months, charge for (current_license_limit * price * months)
      const extensionMonths = months || 1;

      const { data: company } = await supabaseClient
        .from('companies')
        .select('wallet_balance, license_limit, price_per_license, plan_expires_at, plan')
        .eq('id', company_id)
        .single();

      if (!company) throw new Error('Company not found');

      const pricePerSeat = company.price_per_license || 500;
      const currentSeats = company.license_limit || 1;
      const totalCost = currentSeats * pricePerSeat * extensionMonths;

      if ((company.wallet_balance || 0) < totalCost) {
        throw new Error(`Insufficient wallet balance. Need ₹${totalCost.toLocaleString()} for ${extensionMonths} month(s) × ${currentSeats} seats but have ₹${(company.wallet_balance || 0).toLocaleString()}`);
      }

      const now = new Date();
      const currentExpiry = company.plan_expires_at ? new Date(company.plan_expires_at) : null;
      // If already expired or no expiry, start from now; otherwise extend from current expiry
      const baseDate = (currentExpiry && currentExpiry > now) ? currentExpiry : now;
      const newExpiry = new Date(baseDate);
      newExpiry.setMonth(newExpiry.getMonth() + extensionMonths);

      const newBalance = (company.wallet_balance || 0) - totalCost;

      await supabaseClient.from('wallet_transactions').insert({
        company_id,
        amount: totalCost,
        type: 'debit',
        description: `Subscription extended by ${extensionMonths} month(s) — ${currentSeats} seats × ₹${pricePerSeat}/seat`,
        status: 'completed',
        created_by: user.id,
      });

      await supabaseClient
        .from('companies')
        .update({ 
          wallet_balance: newBalance,
          plan_expires_at: newExpiry.toISOString(),
          plan: 'active',
        })
        .eq('id', company_id);

      return new Response(JSON.stringify({ 
        success: true, 
        new_balance: newBalance,
        new_expiry: newExpiry.toISOString(),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');
  } catch (error: unknown) {
    console.error('Razorpay Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
