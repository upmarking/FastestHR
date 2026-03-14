import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CalendarDays, Loader2, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { differenceInDays, parseISO } from 'date-fns';

export default function ApplyLeave() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuthStore();

  const [form, setForm] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: '',
  });

  // Fetch logged-in employee record
  const { data: employee } = useQuery({
    queryKey: ['my-employee', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data } = await supabase
        .from('employees')
        .select('id, first_name, last_name, company_id')
        .eq('user_id', profile.id)
        .is('deleted_at', null)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.id,
  });

  // Fetch leave types for the company
  const { data: leaveTypes = [] } = useQuery({
    queryKey: ['leave-types', employee?.company_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('leave_types')
        .select('*')
        .eq('company_id', employee!.company_id)
        .eq('is_active', true)
        .order('name');
      return data || [];
    },
    enabled: !!employee?.company_id,
  });

  // Fetch leave balances
  const { data: leaveBalances = [] } = useQuery({
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

  // Fetch recent leave requests
  const { data: myLeaves = [] } = useQuery({
    queryKey: ['my-leaves', employee?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('leave_requests')
        .select('*, leave_types(name)')
        .eq('employee_id', employee!.id)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!employee?.id,
  });

  const totalDays =
    form.start_date && form.end_date
      ? Math.max(0, differenceInDays(parseISO(form.end_date), parseISO(form.start_date)) + 1)
      : 0;

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!employee) throw new Error('Employee record not found.');
      const { data, error } = await supabase
        .from('leave_requests')
        .insert([{
          employee_id: employee.id,
          company_id: employee.company_id,
          leave_type_id: form.leave_type_id,
          start_date: form.start_date,
          end_date: form.end_date,
          total_days: totalDays,
          reason: form.reason || null,
          status: 'pending' as const,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-leaves'] });
      toast.success('Leave request submitted successfully');
      setForm({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to submit leave request');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leave_type_id || !form.start_date || !form.end_date) {
      toast.error('Please fill all required fields');
      return;
    }
    if (form.end_date < form.start_date) {
      toast.error('End date cannot be before start date');
      return;
    }
    applyMutation.mutate();
  };

  const statusStyle: Record<string, string> = {
    approved: 'border-success text-success bg-success/10',
    rejected: 'border-destructive text-destructive bg-destructive/10',
    pending: 'border-warning text-warning bg-warning/10',
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'approved') return <CheckCircle className="h-4 w-4 text-success" />;
    if (status === 'rejected') return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-warning" />;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/leave')} className="border border-border/50">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <CalendarDays className="h-6 w-6" /> Apply for Leave
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Submit a new leave request</p>
        </div>
      </div>

      {/* Leave Balances */}
      {leaveBalances.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {leaveBalances.map((lb: any) => (
            <Card
              key={lb.id}
              className={`cursor-pointer transition-all shadow-none ${
                form.leave_type_id === lb.leave_type_id
                  ? 'border-primary bg-primary/10'
                  : 'border-border/50 bg-card/40 hover:border-primary/50'
              }`}
              onClick={() => setForm((p) => ({ ...p, leave_type_id: lb.leave_type_id }))}
            >
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                  {lb.leave_types?.name || 'Leave'}
                </p>
                <p className={`text-2xl font-bold ${form.leave_type_id === lb.leave_type_id ? 'text-primary' : 'text-foreground'}`}>
                  {((lb.total_days || 0) - (lb.used_days || 0) - (lb.pending_days || 0)).toFixed(0)}
                </p>
                <p className="text-xs font-medium text-muted-foreground">of {lb.total_days || 0} remaining</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="overflow-hidden lg:col-span-3">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-base">New Leave Request</CardTitle>
            <CardDescription className="text-xs">Fill in the details below</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Leave Type <span className="text-destructive">*</span>
                </label>
                <select
                  value={form.leave_type_id}
                  onChange={(e) => setForm((p) => ({ ...p, leave_type_id: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  required
                >
                  <option value="">— Select Leave Type —</option>
                  {leaveTypes.map((lt: any) => (
                    <option key={lt.id} value={lt.id}>{lt.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    From Date <span className="text-destructive">*</span>
                  </label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} required className="bg-background/50 border-border/50 text-sm h-10" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    To Date <span className="text-destructive">*</span>
                  </label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} required min={form.start_date} className="bg-background/50 border-border/50 text-sm h-10" />
                </div>
              </div>

              {totalDays > 0 && (
                <div className="rounded border border-border/50 bg-primary/5 px-4 py-3 text-sm text-primary">
                  Duration: <strong>{totalDays} working day{totalDays > 1 ? 's' : ''}</strong>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason / Notes</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                  rows={3}
                  placeholder="Optional reason for leave..."
                  className="flex w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate('/leave')}>Cancel</Button>
                <Button type="submit" disabled={applyMutation.isPending} className="flex-1 gap-2">
                  {applyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {applyMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-sm">Recent Requests</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {myLeaves.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CalendarDays className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground mt-1">No requests found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myLeaves.map((leave: any) => (
                  <div key={leave.id} className="rounded border border-border/50 bg-background/40 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={leave.status} />
                        <span className="text-xs font-medium uppercase">{leave.leave_types?.name || 'Leave'}</span>
                      </div>
                      <Badge variant="outline" className={`uppercase text-[10px] py-0 ${statusStyle[leave.status] || ''}`}>
                        {leave.status}
                      </Badge>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {leave.start_date} → {leave.end_date} · {leave.total_days}d
                    </p>
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
