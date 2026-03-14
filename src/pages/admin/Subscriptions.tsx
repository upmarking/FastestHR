import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Subscriptions() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Platform Subscriptions</h1>
          <p className="text-muted-foreground mt-1">SuperAdmin - Revenue & Billing</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'MRR', value: '$84,500', trend: '+12%', color: 'text-success' },
          { label: 'Active Subs', value: '312', trend: '+4', color: 'text-primary' },
          { label: 'Churn Rate', value: '1.2%', trend: '-0.4%', color: 'text-info' },
        ].map(stat => (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="p-6">
              <h3 className="text-sm text-muted-foreground mb-2 uppercase">{stat.label}</h3>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                <span className={`text-xs font-medium ${stat.color} flex items-center`}>
                  <TrendingUp className="w-3 h-3 mr-1" /> {stat.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/50 bg-primary/5 backdrop-blur shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)] col-span-1 lg:col-span-2">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center text-foreground font-semibold gap-2 text-base">
              <CreditCard className="w-5 h-5" /> RECENT_TRANSACTIONS
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-primary/10 text-sm">
              {[
                { company: 'CyberDyne Systems', plan: 'Enterprise Annual', amount: '$12,000', status: 'Succeeded', date: 'Today, 09:41 AM' },
                { company: 'Initech', plan: 'Growth Monthly', amount: '$499', status: 'Succeeded', date: 'Yesterday, 14:22 PM' },
                { company: 'Hooli', plan: 'Starter Monthly', amount: '$99', status: 'Failed', date: 'Mar 12, 08:00 AM' },
              ].map((tx, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-primary/5 transition-colors">
                  <div className="flex items-center gap-4">
                    {tx.status === 'Succeeded' ? 
                      <CheckCircle2 className="w-5 h-5 text-success" /> : 
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    }
                    <div>
                      <div className="font-medium text-foreground">{tx.company}</div>
                      <div className="text-[10px] text-muted-foreground">{tx.date} &bull; {tx.plan}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{tx.amount}</div>
                    <Badge variant="outline" className={`text-[9px] uppercase px-1 py-0 h-4 border-none ${tx.status === 'Succeeded' ? 'text-success' : 'text-destructive'}`}>
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Plans Config */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-foreground font-semibold text-base">PLAN_CONFIG</CardTitle>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] border border-border/50">EDIT</Button>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-sm">
            <div className="p-3 bg-background/50 rounded border border-border/50">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-primary">Starter</span>
                <span>$99/mo</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Up to 25 employees. Basic modules.</p>
            </div>
            <div className="p-3 bg-background/50 rounded border border-border/50 border-l-2 border-l-primary">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-primary">Growth</span>
                <span>$499/mo</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Up to 100 employees. Advanced ATS & Payroll.</p>
            </div>
            <div className="p-3 bg-background/50 rounded border border-border/50">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-primary">Enterprise</span>
                <span>Custom</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Unlimited employees. Custom integrations.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
