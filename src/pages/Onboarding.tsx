import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, CheckCircle2, Circle, ClipboardList, Upload, Users as UsersIcon, Monitor, PartyPopper } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { useState } from 'react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
}

const defaultSteps: OnboardingStep[] = [
  { id: 'welcome', title: 'Welcome & Orientation', description: 'Complete company orientation and read the employee handbook', icon: PartyPopper, completed: false },
  { id: 'documents', title: 'Document Submission', description: 'Upload ID proof, address proof, educational certificates, and bank details', icon: Upload, completed: false },
  { id: 'policies', title: 'Policy Acknowledgement', description: 'Read and acknowledge company policies, NDA, and code of conduct', icon: ClipboardList, completed: false },
  { id: 'it_setup', title: 'IT & Infrastructure Setup', description: 'Set up email, workstation, VPN access, and communication tools', icon: Monitor, completed: false },
  { id: 'team_intro', title: 'Meet the Team', description: 'Schedule introductory meetings with your team and reporting manager', icon: UsersIcon, completed: false },
];

export default function Onboarding() {
  const { profile } = useAuthStore();
  const isAdmin = profile?.platform_role === 'company_admin' || profile?.platform_role === 'super_admin';

  const { data: newHires = [], isLoading } = useQuery({
    queryKey: ['new-hires', profile?.company_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('employees')
        .select('id, first_name, last_name, date_of_joining, status, department_id, avatar_url, departments(name)')
        .eq('company_id', profile!.company_id!)
        .is('deleted_at', null)
        .in('status', ['probation', 'active'])
        .order('date_of_joining', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  const recentHires = newHires.filter((e: any) => {
    if (!e.date_of_joining) return false;
    const joinDate = new Date(e.date_of_joining);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    return joinDate >= ninetyDaysAgo;
  });

  const [checklistState, setChecklistState] = useState<Record<string, boolean[]>>({});

  const getStepsForEmployee = (empId: string): boolean[] => {
    return checklistState[empId] || defaultSteps.map(() => false);
  };

  const toggleStep = (empId: string, stepIndex: number) => {
    setChecklistState(prev => {
      const current = prev[empId] || defaultSteps.map(() => false);
      const updated = [...current];
      updated[stepIndex] = !updated[stepIndex];
      return { ...prev, [empId]: updated };
    });
  };

  const getProgress = (empId: string) => {
    const steps = getStepsForEmployee(empId);
    const completed = steps.filter(Boolean).length;
    return Math.round((completed / defaultSteps.length) * 100);
  };

  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Onboarding</h1>
          <p className="text-muted-foreground mt-1">Digital onboarding workflow for new hires</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <UserPlus className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Recent Hires (90 days)</p>
              <p className="text-3xl font-bold">{recentHires.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <CheckCircle2 className="w-8 h-8 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Fully Onboarded</p>
              <p className="text-3xl font-bold text-success">
                {recentHires.filter((e: any) => getProgress(e.id) === 100).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <Circle className="w-8 h-8 text-warning" />
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-3xl font-bold text-warning">
                {recentHires.filter((e: any) => { const p = getProgress(e.id); return p > 0 && p < 100; }).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Employee List */}
        <Card className="lg:col-span-1 overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-base">New Hires</CardTitle>
            <CardDescription>Click to view onboarding progress</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : recentHires.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 px-4">
                <UserPlus className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground text-center">No recent hires found</p>
                <p className="text-xs text-muted-foreground/60 text-center">New hires joining in the last 90 days will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentHires.map((emp: any) => {
                  const progress = getProgress(emp.id);
                  return (
                    <div
                      key={emp.id}
                      className={`p-4 cursor-pointer hover:bg-muted/30 transition-colors ${selectedEmployee === emp.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                      onClick={() => setSelectedEmployee(emp.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={emp.avatar_url || ''} />
                          <AvatarFallback className="bg-primary/20 text-primary text-sm">{emp.first_name?.[0]}{emp.last_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{emp.first_name} {emp.last_name}</p>
                          <p className="text-xs text-muted-foreground">{emp.date_of_joining || '—'}</p>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${progress === 100 ? 'border-success text-success bg-success/10' : progress > 0 ? 'border-warning text-warning bg-warning/10' : 'border-muted text-muted-foreground'}`}>
                          {progress}%
                        </Badge>
                      </div>
                      <Progress value={progress} className="h-1 mt-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-base">Onboarding Checklist</CardTitle>
            <CardDescription>
              {selectedEmployee
                ? `Progress for ${recentHires.find((e: any) => e.id === selectedEmployee)?.first_name || 'Employee'}`
                : 'Select an employee to view their checklist'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!selectedEmployee ? (
              <div className="flex flex-col items-center gap-2 py-16">
                <ClipboardList className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Select a new hire to manage their onboarding</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {defaultSteps.map((step, index) => {
                  const steps = getStepsForEmployee(selectedEmployee);
                  const isCompleted = steps[index] || false;
                  return (
                    <div
                      key={step.id}
                      className={`p-5 flex items-start gap-4 hover:bg-muted/20 transition-colors ${isCompleted ? 'opacity-70' : ''}`}
                    >
                      <div className="pt-0.5 cursor-pointer" onClick={() => toggleStep(selectedEmployee, index)}>
                        <Checkbox checked={isCompleted} />
                      </div>
                      <div className={`p-2 rounded-lg ${isCompleted ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>{step.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                      </div>
                      {isCompleted && (
                        <Badge variant="outline" className="border-success text-success bg-success/10 text-[10px]">Done</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
