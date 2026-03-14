import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, TrendingUp, Award, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth-store';

export default function Performance() {
  const { profile } = useAuthStore();

  const { data: goals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const { data: reviewCycles = [], isLoading: loadingCycles } = useQuery({
    queryKey: ['review-cycles'],
    queryFn: async () => {
      const { data } = await supabase
        .from('review_cycles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const activeGoals = goals.filter((g: any) => g.status === 'active');
  const completedGoals = goals.filter((g: any) => g.status === 'completed');
  const avgProgress = goals.length > 0 ? Math.round(goals.reduce((s: number, g: any) => s + (g.progress || 0), 0) / goals.length) : 0;

  const statusColor: Record<string, string> = {
    active: 'border-success text-success bg-success/10',
    at_risk: 'border-warning text-warning bg-warning/10',
    completed: 'border-info text-info bg-info/10',
    missed: 'border-destructive text-destructive bg-destructive/10',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance & Goals</h1>
          <p className="text-muted-foreground mt-1">OKR tracking & appraisal cycles</p>
        </div>
        <Button className="gap-2">
          <Target className="h-4 w-4" /> New Objective
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-6">
          <TrendingUp className="w-8 h-8 text-primary mb-4" />
          <h3 className="text-sm text-muted-foreground mb-1 uppercase">Avg. Progress</h3>
          <div className="text-4xl font-bold">{avgProgress}%</div>
        </CardContent></Card>
        <Card><CardContent className="p-6">
          <Target className="w-8 h-8 text-warning mb-4" />
          <h3 className="text-sm text-muted-foreground mb-1 uppercase">Active Goals</h3>
          <div className="text-4xl font-bold text-warning">{activeGoals.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-6">
          <Award className="w-8 h-8 text-success mb-4" />
          <h3 className="text-sm text-muted-foreground mb-1 uppercase">Completed</h3>
          <div className="text-4xl font-bold text-success">{completedGoals.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-6">
          <Zap className="w-8 h-8 text-info mb-4" />
          <h3 className="text-sm text-muted-foreground mb-1 uppercase">Review Cycles</h3>
          <div className="text-4xl font-bold text-info">{reviewCycles.length}</div>
        </CardContent></Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Current Objectives</CardTitle>
          <CardDescription>Track progress on your goals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingGoals ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)
          ) : goals.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Target className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No goals created yet</p>
              <Button variant="outline" size="sm">Create Your First Goal</Button>
            </div>
          ) : (
            goals.map((goal: any) => (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="font-medium">{goal.title}</div>
                  <Badge variant="outline" className={statusColor[goal.status] || ''}>
                    {goal.status?.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <Progress value={goal.progress || 0} className="h-2" />
                  <span className="text-sm text-muted-foreground w-12 text-right">{goal.progress || 0}%</span>
                </div>
                {goal.due_date && (
                  <p className="text-xs text-muted-foreground">Due: {goal.due_date}</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
