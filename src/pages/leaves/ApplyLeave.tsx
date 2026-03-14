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

const LEAVE_TYPES = [
  { id: 'casual', label: 'Casual Leave', balance: 10 },
  { id: 'sick', label: 'Sick Leave', balance: 8 },
  { id: 'earned', label: 'Earned Leave', balance: 12 },
  { id: 'optional', label: 'Optional Holiday', balance: 2 },
];

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
    queryKey: ['my-employee'],
    queryFn: async () => {
      if (!profile?.id) return null;
      const { data } = await supabase
        .from('employees')
        .select('id, first_name, last_name, company_id')
        .eq('profile_id', profile.id)
        .maybeSingle();
      return data as { id: string; first_name: string; last_name: string; company_id: string } | null;
    },
    enabled: !!profile?.id,
  });

  // Fetch recent leave requests for current employee
  const { data: myLeaves = [] } = useQuery({
    queryKey: ['my-leaves', employee?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('leave_requests')
        .select('*')
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
      if (!employee) throw new Error('Employee record not found. Ensure your account is linked to an employee.');
      const insertData = {
        employee_id: employee.id,
        company_id: employee.company_id,
        leave_type_id: form.leave_type_id,
        start_date: form.start_date,
        end_date: form.end_date,
        total_days: totalDays,
        reason: form.reason || null,
        status: 'pending',
      } as any;
      const { data, error } = await supabase
        .from('leave_requests')
        .insert([insertData])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-leaves'] });
      toast.success('SYSTEM::LEAVE_REQUEST_SUBMITTED — Pending approval');
      setForm({ leave_type_id: '', start_date: '', end_date: '', reason: '' });
    },
    onError: (err: any) => {
      toast.error('ERROR::' + (err?.message || 'Failed to submit leave request'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leave_type_id || !form.start_date || !form.end_date) {
      toast.error('ERROR::MISSING_REQUIRED_FIELDS');
      return;
    }
    if (form.end_date < form.start_date) {
      toast.error('ERROR::END_DATE_BEFORE_START_DATE');
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/leave')}
          className="border border-border/50 hover:border-primary hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <CalendarDays className="h-6 w-6" /> Apply for Leave
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">LEAVE_REQUEST::SUBMISSION_FORM</p>
        </div>
      </div>

      {/* Leave Balances */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {LEAVE_TYPES.map((lt) => (
          <Card
            key={lt.id}
            className={`cursor-pointer transition-all shadow-none ${
              form.leave_type_id === lt.id
                ? 'border-primary bg-primary/10'
                : 'border-border/50 bg-card/40 hover:border-primary/50'
            }`}
            onClick={() => setForm((p) => ({ ...p, leave_type_id: lt.id }))}
          >
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">{lt.label}</p>
              <p className={`text-2xl font-bold ${form.leave_type_id === lt.id ? 'text-primary' : 'text-foreground'}`}>
                {lt.balance}
              </p>
              <p className="text-xs font-medium text-muted-foreground">days left</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <Card className="overflow-hidden lg:col-span-3">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-foreground font-semibold text-base">NEW_LEAVE_REQUEST</CardTitle>
            <CardDescription className="text-xs font-medium">Fill in the details below</CardDescription>
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
                  className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  required
                >
                  <option value="">— Select Leave Type —</option>
                  {LEAVE_TYPES.map((lt) => (
                    <option key={lt.id} value={lt.id}>{lt.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    From Date <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                    required
                    className="bg-background/50 border-border/50 text-sm h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    To Date <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                    required
                    min={form.start_date}
                    className="bg-background/50 border-border/50 text-sm h-10"
                  />
                </div>
              </div>

              {totalDays > 0 && (
                <div className="rounded border border-border/50 bg-primary/5 px-4 py-3 text-sm text-primary">
                  DURATION: <strong>{totalDays} working day{totalDays > 1 ? 's' : ''}</strong>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Reason / Notes
                </label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                  rows={3}
                  placeholder="Optional reason for leave..."
                  className="flex w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/leave')}
                  className="border-border/50"
                >
                  CANCEL
                </Button>
                <Button
                  type="submit"
                  disabled={applyMutation.isPending}
                  className="flex-1 gap-2"
                >
                  {applyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {applyMutation.isPending ? 'SUBMITTING...' : 'SUBMIT_REQUEST'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* My Recent Leaves */}
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-foreground font-semibold text-sm">RECENT_REQUESTS</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {myLeaves.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CalendarDays className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground mt-1">NO_REQUESTS_FOUND</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myLeaves.map((leave: any) => (
                  <div key={leave.id} className="rounded border border-border/50 bg-background/40 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={leave.status} />
                        <span className="text-xs font-medium text-foreground uppercase">{leave.leave_type_id}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`font-mono uppercase text-[10px] py-0 ${statusStyle[leave.status] || ''}`}
                      >
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
