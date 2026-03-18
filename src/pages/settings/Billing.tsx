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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  CalendarClock,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const [extendOpen, setExtendOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [seatCount, setSeatCount] = useState('1');
  const [extensionMonths, setExtensionMonths] = useState('1');
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

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['billing-company'] });
    queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
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
        body: { action: 'create_order', amount, company_id: profile?.company_id },
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
              invalidateAll();
              setAddCreditOpen(false);
              setCreditAmount('');
            } else {
              toast.error(verifyRes.data?.error || 'Payment verification failed');
            }
          } catch (err: any) {
            toast.error('Payment verification failed: ' + err.message);
          }
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
        body: { action: 'purchase_licenses', amount: seats, company_id: profile?.company_id },
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      toast.success(`${seats} license(s) added! Prorated cost: ₹${data.prorated_cost?.toLocaleString()} for ${data.remaining_days} days`);
      invalidateAll();
      setAddSeatsOpen(false);
      setSeatCount('1');
    } catch (err: any) {
      toast.error(err.message || 'Failed to purchase licenses');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtendSubscription = async () => {
    const months = parseInt(extensionMonths);
    if (!months || months < 1) {
      toast.error('Select at least 1 month');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('razorpay-order', {
        body: { action: 'extend_subscription', months, company_id: profile?.company_id },
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      toast.success(`Subscription extended! New expiry: ${new Date(data.new_expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`);
      invalidateAll();
      setExtendOpen(false);
      setExtensionMonths('1');
    } catch (err: any) {
      toast.error(err.message || 'Failed to extend subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  const walletBalance = company?.wallet_balance || 0;
  const licenseLimit = company?.license_limit || 1;
  const pricePerLicense = company?.price_per_license || 500;
  const plan = company?.plan || 'trial';
  const planExpiresAt = company?.plan_expires_at ? new Date(company.plan_expires_at) : null;
  const now = new Date();
  const isExpired = planExpiresAt ? planExpiresAt <= now : false;
  const daysRemaining = planExpiresAt ? Math.max(0, Math.ceil((planExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

  // Prorated seat cost calculation for UI
  const seatsNum = parseInt(seatCount || '0');
  const proratedPerSeat = daysRemaining > 0 ? Math.round((pricePerLicense / 30) * daysRemaining) : 0;
  const seatCost = seatsNum * proratedPerSeat;

  // Extension cost
  const extMonths = parseInt(extensionMonths || '1');
  const extensionCost = licenseLimit * pricePerLicense * extMonths;

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
        <p className="text-muted-foreground mt-1">Manage your wallet, licenses, and subscription</p>
      </div>

      {/* Expiry Warning */}
      {isExpired && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-semibold text-destructive">Subscription Expired</p>
              <p className="text-xs text-muted-foreground">
                Your subscription expired on {planExpiresAt?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. Extend now to continue using all features.
              </p>
            </div>
            <Button size="sm" className="ml-auto shrink-0 gap-1" onClick={() => setExtendOpen(true)}>
              <RefreshCw className="h-3 w-3" /> Extend Now
            </Button>
          </CardContent>
        </Card>
      )}

      {!isExpired && daysRemaining <= 7 && daysRemaining > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="flex items-center gap-4 p-4">
            <Clock className="w-6 h-6 text-yellow-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-yellow-700">Subscription Expiring Soon</p>
              <p className="text-xs text-muted-foreground">
                {daysRemaining} day(s) remaining. Extend your subscription to avoid interruption.
              </p>
            </div>
            <Button size="sm" variant="outline" className="ml-auto shrink-0 gap-1" onClick={() => setExtendOpen(true)}>
              <RefreshCw className="h-3 w-3" /> Extend
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Top Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Wallet Card */}
        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="w-5 h-5 text-primary" /> Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-1">
              <IndianRupee className="w-6 h-6 text-primary" />
              <span className="text-4xl font-bold text-primary tracking-tight">
                {walletBalance.toLocaleString('en-IN')}
              </span>
            </div>
            <Button onClick={() => setAddCreditOpen(true)} className="w-full gap-2">
              <Plus className="h-4 w-4" /> Add Credits
            </Button>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="w-5 h-5 text-primary" /> Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge className={`uppercase text-[10px] ${
                isExpired ? 'bg-destructive/15 text-destructive border-destructive/30' :
                plan === 'trial' ? 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30' :
                'bg-success/15 text-success border-success/30'
              } hover:bg-opacity-20`}>
                {isExpired ? 'EXPIRED' : plan === 'trial' ? 'TRIAL' : 'ACTIVE'}
              </Badge>
              <span className="text-xs text-muted-foreground">₹{pricePerLicense}/seat/mo</span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarClock className="w-3.5 h-3.5" />
                {planExpiresAt
                  ? isExpired
                    ? `Expired ${planExpiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : `${daysRemaining} days left — ${planExpiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : 'No expiry set'}
              </div>
            </div>
            <Button variant="outline" className="w-full gap-2" onClick={() => setExtendOpen(true)}>
              <RefreshCw className="h-4 w-4" /> Extend Subscription
            </Button>
          </CardContent>
        </Card>

        {/* License Card */}
        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-5 h-5 text-primary" /> Licenses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50 text-center">
                <p className="text-2xl font-bold text-foreground">{licenseLimit}</p>
                <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Total</p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50 text-center">
                <p className="text-2xl font-bold text-foreground">{employeeCount}</p>
                <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Used</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setAddSeatsOpen(true)}
              disabled={isExpired}
            >
              <Plus className="h-4 w-4" /> Add Seats
            </Button>
            {isExpired && <p className="text-[10px] text-destructive text-center">Extend subscription to add seats</p>}
          </CardContent>
        </Card>
      </div>

      {/* License Warning */}
      {employeeCount >= licenseLimit && !isExpired && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-semibold text-destructive">License limit reached</p>
              <p className="text-xs text-muted-foreground">
                You have {employeeCount} employees but only {licenseLimit} licenses. Purchase more seats to add new employees.
              </p>
            </div>
            <Button size="sm" className="ml-auto shrink-0" onClick={() => setAddSeatsOpen(true)}>
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
                        <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-yellow-600" />
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
                        'text-yellow-600'
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
              Seats are prorated to your subscription expiry ({daysRemaining} days remaining).
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
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Price per seat (full month)</span>
                <span>₹{pricePerLicense.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Prorated per seat ({daysRemaining} days)</span>
                <span>₹{proratedPerSeat.toLocaleString()}</span>
              </div>
              <div className="border-t border-border/50 pt-1.5 flex justify-between text-sm">
                <span className="font-medium text-foreground">{seatsNum} seat(s) total</span>
                <span className="font-bold text-foreground">₹{seatCost.toLocaleString()}</span>
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
              disabled={isProcessing || walletBalance < seatCost || seatCost === 0}
              className="gap-2"
            >
              {isProcessing ? 'Processing...' : `Purchase ${seatCount} Seat(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Subscription Dialog */}
      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" /> Extend Subscription
            </DialogTitle>
            <DialogDescription>
              Extend your subscription for all {licenseLimit} current seat(s) at ₹{pricePerLicense}/seat/month.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">Duration</label>
              <Select value={extensionMonths} onValueChange={setExtensionMonths}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Month</SelectItem>
                  <SelectItem value="3">3 Months</SelectItem>
                  <SelectItem value="6">6 Months</SelectItem>
                  <SelectItem value="12">12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{licenseLimit} seat(s) × ₹{pricePerLicense.toLocaleString()} × {extMonths} month(s)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">Total</span>
                <span className="font-bold text-foreground">₹{extensionCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Wallet balance after</span>
                <span className={walletBalance - extensionCost < 0 ? 'text-destructive font-medium' : ''}>
                  ₹{(walletBalance - extensionCost).toLocaleString()}
                </span>
              </div>
              <div className="border-t border-border/50 pt-1.5 flex justify-between text-xs text-muted-foreground">
                <span>New expiry</span>
                <span className="text-foreground font-medium">
                  {(() => {
                    const base = (planExpiresAt && !isExpired) ? new Date(planExpiresAt) : new Date();
                    base.setMonth(base.getMonth() + extMonths);
                    return base.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                  })()}
                </span>
              </div>
            </div>
            {walletBalance < extensionCost && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Insufficient wallet balance. Add credits first.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendOpen(false)}>Cancel</Button>
            <Button
              onClick={handleExtendSubscription}
              disabled={isProcessing || walletBalance < extensionCost}
              className="gap-2"
            >
              {isProcessing ? 'Processing...' : `Extend for ₹${extensionCost.toLocaleString()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
