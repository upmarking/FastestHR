import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log("Checking wallet_transactions...");
  const { error: txError } = await supabase.from('wallet_transactions').select('id').limit(1);
  if (txError) {
    console.log("wallet_transactions error:", txError.message);
  } else {
    console.log("wallet_transactions table exists.");
  }

  console.log("Checking companies.subscription_seats...");
  const { data: compData, error: compError } = await supabase.from('companies').select('subscription_seats').limit(1);
  if (compError) {
    console.log("companies error:", compError.message);
  } else {
    console.log("companies.subscription_seats column exists.");
  }
}

checkSchema().catch(console.error);
