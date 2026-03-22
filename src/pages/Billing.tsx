import { useAuthStore } from '@/store/auth-store';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Wallet, ShieldCheck, Users, Calendar, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Billing() {
  const { profile } = useAuthStore();
  const companyId = profile?.company_id;

  const { data: company, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['company-billing', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['wallet-transactions', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: usedSeats = 0, isLoading: isLoadingSeats } = useQuery({
    queryKey: ['used-seats', companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_active', true);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!companyId,
  });

  if (isLoadingCompany) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const currencySymbol = company?.currency === 'INR' ? '₹' : company?.currency === 'EUR' ? '€' : '$';
  const planRate = company?.plan === 'trial' ? 500 : 1000;
  
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-1">Manage your wallet, licenses, and subscription</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Balance Card */}
        <Card className="border-border/50 bg-background/50 shadow-sm overflow-hidden flex flex-col justify-between">
          <CardContent className="p-6 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg tracking-tight">Wallet Balance</h3>
            </div>
            <div className="mb-6 mt-2 flex items-baseline gap-1 break-all">
              <span className="text-4xl text-primary font-light">{currencySymbol}</span>
              <span className="text-5xl font-bold tracking-tighter">{company?.wallet_balance || 0}</span>
            </div>
            <div className="mt-auto pt-2">
              <Button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white border-0 py-6 font-medium text-base shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all hover:shadow-[0_0_25px_rgba(99,102,241,0.6)]">
                + Add Credits
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card className="border-border/50 bg-background/50 shadow-sm overflow-hidden flex flex-col justify-between">
          <CardContent className="p-6 flex flex-col h-full">
             <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg tracking-tight">Subscription</h3>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="text-[10px] font-bold tracking-wider text-amber-500 border-amber-500/30 bg-amber-500/10 uppercase px-2 py-0.5">
                {company?.plan || 'TRIAL'}
              </Badge>
              <div className="text-sm text-muted-foreground font-medium">
                {currencySymbol}{planRate}/seat/mo
              </div>
            </div>

            <div className="mb-6 flex items-center gap-3 bg-muted/20 border border-border/40 rounded-lg p-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                 {company?.plan_expires_at ? new Date(company.plan_expires_at).toLocaleDateString() : 'No expiry set'}
              </span>
            </div>

            <div className="mt-auto pt-2">
              <Button variant="outline" className="w-full border-border hover:bg-muted/50 py-6 font-medium text-base">
                <TrendingUp className="w-4 h-4 mr-2" />
                Extend Subscription
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Licenses Card */}
        <Card className="border-border/50 bg-background/50 shadow-sm overflow-hidden flex flex-col justify-between">
          <CardContent className="p-6 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg tracking-tight">Licenses</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 mt-2">
              <div className="rounded-xl bg-muted/30 border border-border/40 p-4 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold mb-1">{company?.subscription_seats || 5}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total</span>
              </div>
               <div className="rounded-xl bg-muted/30 border border-border/40 p-4 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold mb-1">
                  {isLoadingSeats ? <Skeleton className="h-10 w-10 mt-1" /> : usedSeats}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Used</span>
              </div>
            </div>

             <div className="mt-auto pt-2">
              <Button variant="outline" className="w-full border-border hover:bg-muted/50 py-6 font-medium text-base">
                + Add Seats
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Section */}
      <Card className="border-border/50 bg-background/50 shadow-sm mt-8">
        <CardContent className="p-0">
          <div className="p-5 border-b border-border/50">
             <h3 className="font-semibold text-lg tracking-tight">Recent Transactions</h3>
          </div>
          
          <div className="p-8">
            {isLoadingTransactions ? (
               <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
               </div>
            ) : transactions.length === 0 ? (
               <div className="text-center py-12 text-muted-foreground">
                 <p>No transactions yet. Add credits to get started.</p>
               </div>
            ) : (
                <div className="divide-y divide-border/50">
                  {transactions.map((tx: any) => (
                    <div key={tx.id} className="py-4 flex items-center justify-between hover:bg-muted/10 transition-colors px-4 rounded-md">
                        <div>
                           <p className="font-medium">{tx.description || 'Wallet Top-up'}</p>
                           <p className="text-xs text-muted-foreground mt-1">{new Date(tx.created_at).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                           <span className={`font-bold ${tx.type === 'credit' ? 'text-success' : 'text-foreground'}`}>
                                {tx.type === 'credit' ? '+' : '-'}{currencySymbol}{tx.amount}
                           </span>
                           <div className="mt-1">
                             <Badge variant="outline" className={`text-[9px] uppercase ${tx.type === 'credit' ? 'text-success border-success/30' : 'text-muted-foreground border-border/50'}`}>
                                {tx.type}
                             </Badge>
                           </div>
                        </div>
                    </div>
                  ))}
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
