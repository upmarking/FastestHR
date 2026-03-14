import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, DollarSign, FileText, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth-store';

export default function Payroll() {
  const { profile } = useAuthStore();
  const isAdmin = profile?.platform_role === 'company_admin' || profile?.platform_role === 'super_admin';

  // Payroll runs for admins
  const { data: payrollRuns = [], isLoading: loadingRuns } = useQuery({
    queryKey: ['payroll-runs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('payroll_runs')
        .select('*')
        .order('period_end', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: isAdmin,
  });

  // Payslips for current employee
  const { data: employee } = useQuery({
    queryKey: ['my-employee', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data } = await supabase
        .from('employees')
        .select('id, company_id')
        .eq('user_id', profile.id)
        .is('deleted_at', null)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.id,
  });

  const { data: payslips = [], isLoading: loadingPayslips } = useQuery({
    queryKey: ['payslips', employee?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('payslips')
        .select('*, payroll_runs(period_start, period_end, status)')
        .eq('employee_id', employee!.id)
        .order('created_at', { ascending: false })
        .limit(12);
      return data || [];
    },
    enabled: !!employee?.id,
  });

  // Salary structure
  const { data: salaryStructure } = useQuery({
    queryKey: ['salary-structure', employee?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('salary_structures')
        .select('*')
        .eq('employee_id', employee!.id)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!employee?.id,
  });

  const statusColor: Record<string, string> = {
    draft: 'border-muted text-muted-foreground',
    processing: 'border-warning text-warning bg-warning/10',
    finalized: 'border-success text-success bg-success/10',
    paid: 'border-info text-info bg-info/10',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Engine</h1>
          <p className="text-muted-foreground mt-1">Salary processing & payslips</p>
        </div>
        {isAdmin && (
          <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/10">
            <Activity className="h-4 w-4" /> Run Payroll Cycle
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Salary Structure / Admin Payroll Runs */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> {isAdmin ? 'Recent Payroll Runs' : 'My Salary Structure'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              loadingRuns ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : payrollRuns.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8">
                  <DollarSign className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No payroll runs yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payrollRuns.map((run: any) => (
                    <div key={run.id} className="flex items-center justify-between p-3 rounded bg-background/40 border border-border/50">
                      <div>
                        <p className="font-medium text-sm">{run.period_start} — {run.period_end}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Gross: ${(run.total_gross || 0).toLocaleString()} · Net: ${(run.total_net || 0).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className={`uppercase text-[10px] ${statusColor[run.status] || ''}`}>
                        {run.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )
            ) : salaryStructure ? (
              <div className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-3xl font-bold text-primary mb-1">
                    ${(salaryStructure.gross_salary || 0).toLocaleString()}<span className="text-lg text-muted-foreground">/yr</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">Effective from {salaryStructure.effective_from || 'N/A'}</p>
                </div>
                {Array.isArray(salaryStructure.components) && (salaryStructure.components as any[]).map((comp: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-background/50 rounded border border-border/50 text-sm">
                    <span className="text-muted-foreground">{comp.name || comp.label}</span>
                    <span>${(comp.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8">
                <DollarSign className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No salary structure configured</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payslips */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Payslip Archive
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPayslips ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : payslips.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <FileText className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No payslips generated yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payslips.map((slip: any) => (
                  <div key={slip.id} className="flex items-center justify-between p-3 rounded bg-background/40 hover:bg-primary/5 border border-border/50 transition-colors">
                    <div>
                      <h4 className="font-medium text-primary text-sm">
                        {slip.payroll_runs?.period_start} — {slip.payroll_runs?.period_end}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="border-success text-success bg-success/10 text-[10px] uppercase px-1 py-0">
                          {slip.payroll_runs?.status || 'processed'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Net: ${(slip.net_salary || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/20">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
