import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Award, Zap } from 'lucide-react';

export default function Performance() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Performance & Goals</h1>
          <p className="text-muted-foreground mt-1">OKR tracking & appraisal cycles</p>
        </div>
        <Button className="gap-2">
          <Target className="h-4 w-4" /> NEW_OBJECTIVE
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <TrendingUp className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-sm text-muted-foreground mb-1 uppercase">Avg. Completion</h3>
            <div className="text-4xl font-bold text-foreground font-semibold">78%</div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <Target className="w-8 h-8 text-warning mb-4" />
            <h3 className="text-sm text-muted-foreground mb-1 uppercase">Active OKRs</h3>
            <div className="text-4xl font-bold text-warning">4</div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <Award className="w-8 h-8 text-success mb-4" />
            <h3 className="text-sm text-muted-foreground mb-1 uppercase">Last Rating</h3>
            <div className="text-3xl font-bold text-success">Exceeds</div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <Zap className="w-8 h-8 text-info mb-4" />
            <h3 className="text-sm text-muted-foreground mb-1 uppercase">Next Appraisal</h3>
            <div className="text-2xl font-bold text-info mt-1">Jun 2026</div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground font-semibold gap-2">
            CURRENT_OBJECTIVES
          </CardTitle>
          <CardDescription className="text-muted-foreground">Q2 2026 Goals - Track your progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            { title: 'Launch HRMS Platform v1.0', progress: 85, status: 'On Track', color: 'success' },
            { title: 'Achieve 99.9% Uptime across services', progress: 100, status: 'Completed', color: 'info' },
            { title: 'Reduce API latency to < 50ms', progress: 45, status: 'At Risk', color: 'warning' },
            { title: 'Complete SOC2 Compliance prep', progress: 20, status: 'Behind', color: 'destructive' },
          ].map((okr, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="font-medium">{okr.title}</div>
                <Badge variant="outline" className={`border-${okr.color} text-${okr.color} uppercase bg-${okr.color}/10`}>
                  {okr.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <Progress value={okr.progress} className={`h-2 [&>div]:bg-${okr.color}`} />
                <span className="text-sm text-muted-foreground w-12 text-right">{okr.progress}%</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
