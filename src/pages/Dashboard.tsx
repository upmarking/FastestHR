import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, Clock, CalendarDays, Briefcase, DollarSign, UserPlus,
  Megaphone, TrendingUp, ArrowRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

function MetricCard({ title, value, icon: Icon, trend, color }: {
  title: string; value: string | number; icon: any; trend?: string; color: string;
}) {
  return (
    <Card className="relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
            {trend && <p className="mt-1 text-xs text-success">{trend}</p>}
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border/50 ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CompanyAdminDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  const { data: employeeCount = 0, isLoading: loadingEmployees } = useQuery({
    queryKey: ['employee-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);
      return count || 0;
    },
  });

  const { data: leaveRequests = [], isLoading: loadingLeave } = useQuery({
    queryKey: ['pending-leaves'],
    queryFn: async () => {
      const { data } = await supabase
        .from('leave_requests')
        .select('*, employees!leave_requests_employee_id_fkey(first_name, last_name)')
        .eq('status', 'pending')
        .limit(5);
      return data || [];
    },
  });

  const { data: openJobs = 0 } = useQuery({
    queryKey: ['open-jobs'],
    queryFn: async () => {
      const { count } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
      return count || 0;
    },
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ['recent-announcements'],
    queryFn: async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {profile?.full_name}</p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Employees" value={loadingEmployees ? '...' : employeeCount} icon={Users} color="bg-primary/10 text-primary" />
        <MetricCard title="Present Today" value="—" icon={Clock} color="bg-success/10 text-success" />
        <MetricCard title="On Leave Today" value="—" icon={CalendarDays} color="bg-warning/10 text-warning" />
        <MetricCard title="Open Positions" value={openJobs} icon={Briefcase} color="bg-info/10 text-info" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Leave Requests */}
        <Card className="lg:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4 relative z-10">
            <CardTitle>Pending Leave Requests</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/leave')}>
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {loadingLeave ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : leaveRequests.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No pending leave requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaveRequests.map((req: any) => (
                  <div key={req.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-3 hover:border-border/50 hover:bg-muted/30 transition-all cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {req.employees?.first_name} {req.employees?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {req.start_date} — {req.end_date} · {req.total_days} days
                      </p>
                    </div>
                    <Badge variant="outline" className="border-warning text-warning">Pending</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/employees/new')}>
              <UserPlus className="h-4 w-4" /> Add Employee
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/payroll')}>
              <DollarSign className="h-4 w-4" /> Run Payroll
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/recruitment')}>
              <Briefcase className="h-4 w-4" /> Post a Job
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/announcements')}>
              <Megaphone className="h-4 w-4" /> Send Announcement
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Announcements */}
      {announcements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.map((a: any) => (
              <div key={a.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{a.title}</p>
                  {a.is_pinned && <Badge>Pinned</Badge>}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EmployeeDashboard() {
  const { profile } = useAuthStore();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{greeting}, {profile?.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground">
          {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Clock In Card */}
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <Clock className="h-12 w-12 text-primary" />
            <p className="text-lg font-semibold">Today's Attendance</p>
            <Button size="lg" className="w-full">Clock In</Button>
          </CardContent>
        </Card>

        {/* Leave Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leave Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No leave data yet</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2">
              <CalendarDays className="h-4 w-4" /> Apply Leave
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <TrendingUp className="h-4 w-4" /> My Goals
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SuperAdminDashboard() {
  const { data: companyCount = 0 } = useQuery({
    queryKey: ['company-count'],
    queryFn: async () => {
      const { count } = await supabase.from('companies').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Overview</h1>
        <p className="text-muted-foreground">Super Admin Dashboard</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Companies" value={companyCount} icon={Users} color="bg-primary/10 text-primary" />
        <MetricCard title="Active Subscriptions" value="—" icon={DollarSign} color="bg-success/10 text-success" />
        <MetricCard title="Trial Companies" value="—" icon={Clock} color="bg-warning/10 text-warning" />
        <MetricCard title="Monthly Revenue" value="—" icon={TrendingUp} color="bg-info/10 text-info" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { profile } = useAuthStore();

  if (profile?.platform_role === 'super_admin') return <SuperAdminDashboard />;
  if (profile?.platform_role === 'company_admin') return <CompanyAdminDashboard />;
  return <EmployeeDashboard />;
}
