import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Save, Pencil, X, Loader2,
  Mail, Phone, Building2, Briefcase, CalendarDays,
  Clock, UserCheck, AlertTriangle, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/40',
  probation: 'bg-warning/10 text-warning border-warning/40',
  on_leave: 'bg-info/10 text-info border-info/40',
  resigned: 'bg-muted text-muted-foreground',
  terminated: 'bg-destructive/10 text-destructive border-destructive/40',
};

const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'intern'] as const;
const STATUS_OPTIONS = ['active', 'probation', 'on_leave', 'resigned', 'terminated'] as const;
const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'] as const;

type Tab = 'profile' | 'attendance' | 'leaves' | 'payroll';

interface EmployeeRecord {
  id: string;
  first_name: string;
  last_name: string;
  work_email: string;
  personal_email: string | null;
  phone: string | null;
  employee_code: string | null;
  status: string;
  gender: string | null;
  employment_type: string | null;
  date_of_joining: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  department_id: string | null;
  designation_id: string | null;
  reporting_manager_id: string | null;
  departments?: { name: string } | null;
  designations?: { title: string } | null;
}

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [form, setForm] = useState<Partial<EmployeeRecord>>({});

  const { data: employee, isLoading } = useQuery<EmployeeRecord>({
    queryKey: ['employee', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*, departments(name), designations(title)')
        .eq('id', id!)
        .is('deleted_at', null)
        .single();
      if (error) throw error;
      return data as unknown as EmployeeRecord;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (employee) setForm({ ...employee });
  }, [employee]);

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', profile?.company_id],
    queryFn: async () => {
      const { data } = await supabase.from('departments').select('id, name').eq('company_id', profile!.company_id!).order('name');
      return (data || []) as { id: string; name: string }[];
    },
    enabled: !!profile?.company_id,
  });

  const { data: designations = [] } = useQuery({
    queryKey: ['designations', profile?.company_id],
    queryFn: async () => {
      const { data } = await supabase.from('designations').select('id, title').eq('company_id', profile!.company_id!).order('title');
      return (data || []) as { id: string; title: string }[];
    },
    enabled: !!profile?.company_id,
  });

  const { data: managers = [] } = useQuery({
    queryKey: ['managers', profile?.company_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('employees')
        .select('id, first_name, last_name, employee_code')
        .eq('company_id', profile!.company_id!)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('first_name');
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  const { data: leaveHistory = [] } = useQuery({
    queryKey: ['leave-history', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', id!)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!id && activeTab === 'leaves',
  });

  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['attendance', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', id!)
        .order('date', { ascending: false })
        .limit(30);
      return data || [];
    },
    enabled: !!id && activeTab === 'attendance',
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<EmployeeRecord>) => {
      const updateData = {
        first_name: payload.first_name,
        last_name: payload.last_name,
        work_email: payload.work_email,
        personal_email: payload.personal_email || null,
        phone: payload.phone || null,
        employee_code: payload.employee_code || null,
        department_id: payload.department_id || null,
        designation_id: payload.designation_id || null,
        reporting_manager_id: payload.reporting_manager_id || null,
        date_of_joining: payload.date_of_joining || null,
        date_of_birth: payload.date_of_birth || null,
        gender: payload.gender,
        employment_type: payload.employment_type,
        status: payload.status,
      } as any;
      const { data, error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', id!)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('SYSTEM::EMPLOYEE_UPDATED');
      setEditing(false);
    },
    onError: (err: any) => {
      toast.error('ERROR::' + (err?.message || 'Update failed'));
    },
  });

  const terminateMutation = useMutation({
    mutationFn: async () => {
      const { error: empError } = await supabase
        .from('employees')
        .update({ status: 'terminated', deleted_at: new Date().toISOString() })
        .eq('id', id!);
      if (empError) throw empError;

      const { error: exitError } = await supabase
        .from('employee_exits')
        .insert({
          company_id: profile!.company_id!,
          employee_id: id!,
          status: 'initiated',
          reason: 'Terminated by company',
          last_working_day: new Date().toISOString().split('T')[0]
        });
      // Ignore unique violation if the employee already has an exit record
      if (exitError && exitError.code !== '23505') throw exitError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      toast.success('SYSTEM::EMPLOYEE_TERMINATED');
      navigate('/employees');
    },
    onError: (err: any) => {
      toast.error('ERROR::' + (err?.message || 'Failed to terminate'));
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center gap-4 py-24">
        <AlertTriangle className="h-16 w-16 text-destructive/40" />
        <p className="text-lg">EMPLOYEE_NOT_FOUND</p>
        <Button onClick={() => navigate('/employees')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Employees
        </Button>
      </div>
    );
  }

  const initials = `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase();

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'PROFILE' },
    { id: 'attendance', label: 'ATTENDANCE' },
    { id: 'leaves', label: 'LEAVE_HISTORY' },
    { id: 'payroll', label: 'PAYROLL' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/employees')}
          className="border border-border/50 hover:border-primary hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {employee.first_name} {employee.last_name}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {employee.employee_code && <span className="mr-3">{employee.employee_code}</span>}
            {employee.designations?.title || '—'}
          </p>
        </div>
        <Badge
          className={`font-mono uppercase text-xs ${STATUS_BADGE[employee.status] || ''}`}
          variant="outline"
        >
          {employee.status}
        </Badge>
        <div className="flex items-center gap-2">
          {!editing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="border-border/50 hover:border-primary/50 transition-all"
            >
              <Pencil className="h-4 w-4 mr-2" /> EDIT
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                onClick={() => updateMutation.mutate(form)}
                disabled={updateMutation.isPending}
                className="font-mono"
              >
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                SAVE
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setForm({ ...employee }); setEditing(false); }}
                className="font-mono"
              >
                <X className="h-4 w-4 mr-2" /> DISCARD
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <Avatar className="h-20 w-20 border-2 border-border/50">
              <AvatarImage src={employee.avatar_url || ''} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 grid sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary/60" />
                <span className="truncate">{employee.work_email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary/60" />
                <span>{employee.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4 text-primary/60" />
                <span>{employee.departments?.name || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4 text-primary/60" />
                <span>{employee.employment_type?.replace(/_/g, ' ') || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-primary/60" />
                <span>Joined: {employee.date_of_joining || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserCheck className="h-4 w-4 text-primary/60" />
                <span>Gender: {employee.gender || '—'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-foreground font-semibold text-base">EDIT_PROFILE_INFORMATION</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid sm:grid-cols-2 gap-4">
            {([
              { label: 'First Name', name: 'first_name', required: true },
              { label: 'Last Name', name: 'last_name', required: true },
              { label: 'Work Email', name: 'work_email', type: 'email', required: true },
              { label: 'Personal Email', name: 'personal_email', type: 'email' },
              { label: 'Phone', name: 'phone' },
              { label: 'Employee Code', name: 'employee_code' },
              { label: 'Date of Joining', name: 'date_of_joining', type: 'date' },
              { label: 'Date of Birth', name: 'date_of_birth', type: 'date' },
            ] as { label: string; name: keyof EmployeeRecord; type?: string; required?: boolean }[]).map(({ label, name, type = 'text', required }) => (
              <div key={name as string} className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {label}{required && <span className="text-destructive ml-0.5">*</span>}
                </label>
                <Input
                  type={type}
                  name={name as string}
                  value={(form[name] as string) || ''}
                  onChange={handleChange}
                  disabled={!editing}
                  className="bg-background/50 border-border/50 text-sm h-10 disabled:opacity-60"
                />
              </div>
            ))}

            {/* Select fields */}
            {([
              {
                label: 'Gender', name: 'gender',
                options: GENDERS.map(g => ({ value: g, label: g.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }))
              },
              {
                label: 'Employment Type', name: 'employment_type',
                options: EMPLOYMENT_TYPES.map(t => ({ value: t, label: t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }))
              },
              {
                label: 'Status', name: 'status',
                options: STATUS_OPTIONS.map(s => ({ value: s, label: s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }))
              },
              {
                label: 'Department', name: 'department_id',
                options: departments.map(d => ({ value: d.id, label: d.name }))
              },
              {
                label: 'Designation', name: 'designation_id',
                options: designations.map(d => ({ value: d.id, label: d.title }))
              },
              {
                label: 'Reporting Manager', name: 'reporting_manager_id',
                options: managers.map((m: any) => ({
                  value: m.id,
                  label: `${m.first_name} ${m.last_name}${m.employee_code ? ` (${m.employee_code})` : ''}`,
                }))
              },
            ] as { label: string; name: string; options: { value: string; label: string }[] }[]).map(({ label, name, options }) => (
              <div key={name} className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
                <select
                  name={name}
                  value={(form as any)[name] || ''}
                  onChange={handleChange}
                  disabled={!editing}
                  className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground disabled:opacity-60 focus:border-primary focus:outline-none"
                >
                  <option value="">— Select —</option>
                  {options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Attendance tab */}
      {activeTab === 'attendance' && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-foreground font-semibold text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> ATTENDANCE_RECORDS
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceRecords.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground mt-1">NO_ATTENDANCE_RECORDS_FOUND</p>
              </div>
            ) : (
              <div className="divide-y divide-primary/10">
                {attendanceRecords.map((rec: any) => (
                  <div key={rec.id} className="flex items-center justify-between py-3 text-sm">
                    <span className="text-primary">{rec.date}</span>
                    <span className="text-muted-foreground">{rec.clock_in ? new Date(rec.clock_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'} → {rec.clock_out ? new Date(rec.clock_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}</span>
                    <Badge variant="outline" className="uppercase text-xs">
                      {rec.status || 'present'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Leave history tab */}
      {activeTab === 'leaves' && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-foreground font-semibold text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> LEAVE_HISTORY
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaveHistory.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground mt-1">NO_LEAVE_RECORDS_FOUND</p>
              </div>
            ) : (
              <div className="divide-y divide-primary/10">
                {leaveHistory.map((leave: any) => (
                  <div key={leave.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="text-foreground">{leave.leave_type_id || 'Leave'}</p>
                      <p className="text-muted-foreground text-xs">{leave.start_date} → {leave.end_date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{leave.total_days} days</span>
                      <Badge
                        variant="outline"
                        className={`font-mono uppercase text-xs ${
                          leave.status === 'approved' ? 'border-success text-success' :
                          leave.status === 'rejected' ? 'border-destructive text-destructive' :
                          'border-warning text-warning'
                        }`}
                      >
                        {leave.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payroll tab */}
      {activeTab === 'payroll' && (
        <Card className="overflow-hidden">
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
            <span className="text-4xl">💰</span>
            <p className="text-muted-foreground mt-1">PAYROLL_MODULE::Navigate to Payroll section</p>
            <Button variant="outline" onClick={() => navigate('/payroll')} className="mt-2 border-border/50 hover:border-primary/50 transition-all">
              Go to Payroll
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="border-destructive/30 bg-destructive/5 backdrop-blur shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-destructive text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> DANGER_ZONE
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm text-foreground">Terminate Employee</p>
            <p className="text-xs font-medium text-muted-foreground">Marks the employee as terminated and soft-deletes their record.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => {
              if (confirm('CONFIRM::Terminate this employee? This action cannot be undone easily.')) {
                terminateMutation.mutate();
              }
            }}
            disabled={terminateMutation.isPending}
          >
            {terminateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
            TERMINATE
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
