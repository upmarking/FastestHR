import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth-store';

export default function Leave() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  // Get employee record for current user
  const { data: employee } = useQuery({
    queryKey: ['my-employee', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('employees')
        .select('id, company_id')
        .eq('user_id', profile!.id)
        .is('deleted_at', null)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.id,
  });

  // Leave balances
  const { data: leaveBalances = [], isLoading: loadingBalances } = useQuery({
    queryKey: ['leave-balances', employee?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('leave_balances')
        .select('*, leave_types(name, color)')
        .eq('employee_id', employee!.id)
        .eq('year', new Date().getFullYear());
      return data || [];
    },
    enabled: !!employee?.id,
  });

  // Leave requests - for admins show all company requests, for employees show own
  const { data: leaveRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['leave-requests', profile?.platform_role, employee?.id],
    queryFn: async () => {
      let query = supabase
        .from('leave_requests')
        .select('*, employees!leave_requests_employee_id_fkey(first_name, last_name), leave_types(name)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (profile?.platform_role !== 'company_admin' && profile?.platform_role !== 'super_admin' && employee?.id) {
        query = query.eq('employee_id', employee.id);
      }

      const { data } = await query;
      return data || [];
    },
    enabled: !!profile,
  });

  const statusStyle: Record<string, { class: string; Icon: any }> = {
    approved: { class: 'border-success text-success bg-success/10', Icon: CheckCircle },
    rejected: { class: 'border-destructive text-destructive bg-destructive/10', Icon: XCircle },
    pending: { class: 'border-warning text-warning bg-warning/10', Icon: Clock },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground mt-1">Time-off requests & balances</p>
        </div>
        <Button onClick={() => navigate('/leave/apply')} className="gap-2">
          <Plus className="h-4 w-4" /> Apply Leave
        </Button>
      </div>

      {/* Leave Balances */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loadingBalances ? (
          [1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : leaveBalances.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-4">
            <CardContent className="flex flex-col items-center gap-2 py-8">
              <Calendar className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No leave balances configured yet</p>
            </CardContent>
          </Card>
        ) : (
          leaveBalances.map((lb: any) => {
            const remaining = (lb.total_days || 0) - (lb.used_days || 0);
            return (
              <Card key={lb.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <h3 className="text-sm text-muted-foreground mb-4 uppercase">{lb.leave_types?.name || 'Leave'}</h3>
                  <div className="flex items-end justify-between">
                    <div className="text-4xl font-bold text-primary">{remaining}</div>
                    <div className="text-sm text-muted-foreground pb-1">/ {lb.total_days || 0} remaining</div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Recent Requests */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Recent Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : leaveRequests.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No leave requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaveRequests.map((req: any) => {
                const s = statusStyle[req.status] || statusStyle.pending;
                return (
                  <div key={req.id} className="flex items-center justify-between p-4 rounded-lg bg-background/40 border border-border/50">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full bg-background ${s.class.includes('success') ? 'text-success' : s.class.includes('destructive') ? 'text-destructive' : 'text-warning'} border border-current`}>
                        <s.Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-primary">
                          {req.leave_types?.name || 'Leave'}
                          {req.employees && <span className="text-muted-foreground font-normal text-sm ml-2">— {req.employees.first_name} {req.employees.last_name}</span>}
                        </h4>
                        <p className="text-sm text-muted-foreground">{req.start_date} — {req.end_date} &bull; {req.total_days} Day{(req.total_days || 0) > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`uppercase tracking-wider ${s.class}`}>
                      {req.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
