import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, DollarSign, FileText, Activity } from 'lucide-react';

export default function Payroll() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Payroll Engine</h1>
          <p className="text-muted-foreground mt-1">Salary processing & payslips</p>
        </div>
        <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/10">
          <Activity className="h-4 w-4" /> RUN_PAYROLL_CYCLE
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground font-semibold gap-2">
              <DollarSign className="w-5 h-5" /> CURRENT_CTC_BREAKDOWN
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-primary mb-1">$120,000<span className="text-lg text-muted-foreground">/yr</span></h3>
              <p className="text-sm text-muted-foreground mt-1">Net Payable Estimated: $8,450.00 / mo</p>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-2 bg-background/50 rounded border border-border/50">
                <span className="text-muted-foreground">Basic Salary</span>
                <span>$60,000</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-background/50 rounded border border-border/50">
                <span className="text-muted-foreground">House Rent Allowance (HRA)</span>
                <span>$30,000</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-background/50 rounded border border-border/50">
                <span className="text-muted-foreground">Special Allowance</span>
                <span>$20,000</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-background/50 rounded border border-border/50">
                <span className="text-muted-foreground">LTA / Medical</span>
                <span>$10,000</span>
              </div>
              <div className="flex justify-between items-center p-2 border border-destructive/30 bg-destructive/5 rounded text-destructive mt-4">
                <span>Estimated Tax (TDS)</span>
                <span>-$1,250.00/mo</span>
              </div>
              <div className="flex justify-between items-center p-2 border border-destructive/30 bg-destructive/5 rounded text-destructive">
                <span>Provident Fund (PF)</span>
                <span>-$300.00/mo</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground font-semibold gap-2">
              <FileText className="w-5 h-5" /> PAYSLIP_ARCHIVE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { month: 'February 2026', status: 'Processed', amount: '$8,450.00' },
                { month: 'January 2026', status: 'Processed', amount: '$8,450.00' },
                { month: 'December 2025', status: 'Processed', amount: '$8,450.00' },
                { month: 'November 2025', status: 'Processed', amount: '$8,100.00' },
                { month: 'October 2025', status: 'Processed', amount: '$8,100.00' },
              ].map((slip, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded bg-background/40 hover:bg-primary/5 border border-border/50 transition-colors">
                  <div>
                    <h4 className="font-medium text-primary">{slip.month}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="border-success text-success bg-success/10 text-[10px] uppercase px-1 py-0">{slip.status}</Badge>
                      <span className="text-xs text-muted-foreground">Net: {slip.amount}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-primary hover:text-primary hover:bg-primary/20">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
