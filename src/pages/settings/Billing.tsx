import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Wallet,
  Plus,
  CreditCard,
  Users,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Billing() {
  const { profile } = useAuthStore();
  const queryClient = useQueryClient();
  const [addCreditOpen, setAddCreditOpen] = useState(false);
  const [addSeatsOpen, setAddSeatsOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [seatCount, setSeatCount] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['billing-company', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return null;
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .maybeSingle();
      return data as any;
    },
    enabled: !!profile?.company_id,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['wallet-transactions', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data } = await (supabase.from('wallet_transactions' as any) as any)
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .limit(20);
      return (data || []) as any[];
    },
    enabled: !!profile?.company_id,
  });

  const { data: employeeCount = 0 } = useQuery({
    queryKey: ['employee-count', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return 0;
      const { count } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
        .is('deleted_at', null);
      return count || 0;
    },
    enabled: !!profile?.company_id,
  });

  const loadRazorpayScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.body.appendChild(script);
    });
  };

  const handleAddCredits = async () => {
    const amount = parseFloat(creditAmount);
    if (!amount || amount < 100) {
      toast.error('Minimum recharge amount is ₹100');
      return;
    }

    setIsProcessing(true);
    try {
      await loadRazorpayScript();

      const { data, error } = await supabase.functions.invoke('razorpay-order', {
        body: {
          action: 'create_order',
          amount,
          company_id: profile?.company_id,
        },
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: company?.name || 'FastestHR',
        description: `Wallet Recharge — ₹${amount.toLocaleString()}`,
        order_id: data.order_id,
        handler: async (response: any) => {
          try {
            const verifyRes = await supabase.functions.invoke('razorpay-order', {
              body: {
                action: 'verify_payment',
                company_id: profile?.company_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            });

            if (verifyRes.data?.success) {
              toast.success(`₹${amount.toLocaleString()} added to wallet!`);
              queryClient.invalidateQueries({ queryKey: ['billing-company'] });
              queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
              setAddCreditOpen(false);
              setCreditAmount('');
            } else {
              toast.error(verifyRes.data?.error || 'Payment verification failed');
            }
          } catch (err: any) {
            toast.error('Payment verification failed: ' + err.message);
          }
        },
        prefill: {
          email: profile?.full_name ? undefined : undefined,
        },
        theme: { color: '#6366f1' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchaseSeats = async () => {
    const seats = parseInt(seatCount);
    if (!seats || seats < 1) {
      toast.error('Enter at least 1 seat');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('razorpay-order', {
        body: {
          action: 'purchase_licenses',
          amount: seats,
          company_id: profile?.company_id,
        },
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      toast.success(`${seats} license(s) added! New limit: ${data.new_license_limit}`);
      queryClient.invalidateQueries({ queryKey: ['billing-company'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      setAddSeatsOpen(false);
      setSeatCount('1');
    } catch (err: any) {
      toast.error(err.message || 'Failed to purchase licenses');
    } finally {
      setIsProcessing(false);
    }
  };

  const walletBalance = company?.wallet_balance || 0;
  const licenseLimit = company?.license_limit || 5;
  const pricePerLicense = company?.price_per_license || 500;
  const seatCost = parseInt(seatCount || '0') * pricePerLicense;

  if (companyLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-1">Manage your wallet, licenses, and transactions</p>
      </div>

      {/* Top Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Wallet Card */}
        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="w-5 h-5 text-primary" /> Wallet Balance
            </CardTitle>
            <CardDescription>Manage your credits and payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-1">
              <IndianRupee className="w-6 h-6 text-primary" />
              <span className="text-4xl font-bold text-primary tracking-tight">
                {walletBalance.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setAddCreditOpen(true)}
                className="flex-1 gap-2"
              >
                <Plus className="h-4 w-4" /> Add Credits
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                disabled
              >
                <CreditCard className="h-4 w-4" /> Redeem Gift Card
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="w-5 h-5 text-primary" /> Subscription & Licenses
            </CardTitle>
            <CardDescription>₹{pricePerLicense.toLocaleString()}/seat/month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-[10px] uppercase text-muted-foreground font-medium tracking-wider">Total Seats</p>
                <p className="text-3xl font-bold text-foreground">{licenseLimit}</p>
                <p className="text-xs text-muted-foreground">{employeeCount} used</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-[10px] uppercase text-muted-foreground font-medium tracking-wider">Status</p>
                <Badge className="mt-2 bg-success/15 text-success border-success/30 hover:bg-success/20">
                  ACTIVE
                </Badge>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {company?.plan_expires_at
                    ? `Expires ${new Date(company.plan_expires_at).toLocaleDateString()}`
                    : 'No expiry set'}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setAddSeatsOpen(true)}
            >
              <Users className="h-4 w-4" /> Add More Seats
              <Plus className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* License Warning */}
      {employeeCount >= licenseLimit && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-semibold text-destructive">License limit reached</p>
              <p className="text-xs text-muted-foreground">
                You have {employeeCount} employees but only {licenseLimit} licenses. Purchase more seats to add new employees.
              </p>
            </div>
            <Button
              size="sm"
              className="ml-auto shrink-0"
              onClick={() => setAddSeatsOpen(true)}
            >
              Add Seats
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      <Card>
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {txLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No transactions yet. Add credits to get started.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    {tx.type === 'credit' ? (
                      tx.status === 'completed' ? (
                        <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-success" />
                        </div>
                      ) : tx.status === 'failed' ? (
                        <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-warning" />
                        </div>
                      )
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <TrendingDown className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${
                      tx.type === 'credit' 
                        ? tx.status === 'completed' ? 'text-success' : 'text-muted-foreground'
                        : 'text-destructive'
                    }`}>
                      {tx.type === 'credit' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[9px] uppercase px-1.5 py-0 h-4 border-none ${
                        tx.status === 'completed' ? 'text-success' :
                        tx.status === 'failed' ? 'text-destructive' :
                        'text-warning'
                      }`}
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Credits Dialog */}
      <Dialog open={addCreditOpen} onOpenChange={setAddCreditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" /> Add Credits
            </DialogTitle>
            <DialogDescription>
              Recharge your wallet via Razorpay. Minimum ₹100.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">Amount (₹)</label>
              <Input
                type="number"
                min="100"
                step="100"
                placeholder="Enter amount"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {[1000, 5000, 10000, 50000].map(val => (
                <Button
                  key={val}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setCreditAmount(val.toString())}
                >
                  ₹{val.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCreditOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCredits} disabled={isProcessing} className="gap-2">
              {isProcessing ? 'Processing...' : <>
                <IndianRupee className="h-4 w-4" /> Pay ₹{parseFloat(creditAmount || '0').toLocaleString()}
              </>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Seats Dialog */}
      <Dialog open={addSeatsOpen} onOpenChange={setAddSeatsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Purchase Licenses
            </DialogTitle>
            <DialogDescription>
              Each license costs ₹{pricePerLicense.toLocaleString()}/seat. Deducted from wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">Number of Seats</label>
              <Input
                type="number"
                min="1"
                value={seatCount}
                onChange={(e) => setSeatCount(e.target.value)}
              />
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{seatCount || 0} seat(s) × ₹{pricePerLicense.toLocaleString()}</span>
                <span className="font-bold">₹{seatCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Wallet balance after</span>
                <span className={walletBalance - seatCost < 0 ? 'text-destructive font-medium' : ''}>
                  ₹{(walletBalance - seatCost).toLocaleString()}
                </span>
              </div>
            </div>
            {walletBalance < seatCost && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Insufficient wallet balance. Add credits first.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSeatsOpen(false)}>Cancel</Button>
            <Button
              onClick={handlePurchaseSeats}
              disabled={isProcessing || walletBalance < seatCost}
              className="gap-2"
            >
              {isProcessing ? 'Processing...' : `Purchase ${seatCount} Seat(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
