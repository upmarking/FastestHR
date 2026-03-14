import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Users, Plus, MoreHorizontal, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

export default function Recruitment() {
  const navigate = useNavigate();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const { data: jobs = [], isLoading: loadingJobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('jobs')
        .select('*, departments(name)')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const activeJobId = selectedJobId || (jobs.length > 0 ? jobs[0].id : null);

  const { data: candidates = [], isLoading: loadingCandidates } = useQuery({
    queryKey: ['candidates', activeJobId],
    queryFn: async () => {
      const { data } = await supabase
        .from('candidates')
        .select('*')
        .eq('job_id', activeJobId!)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!activeJobId,
  });

  const stages = ['applied', 'screening', 'interview', 'assessment', 'offer', 'hired', 'rejected'] as const;
  const stageColors: Record<string, string> = {
    applied: 'info', screening: 'warning', interview: 'primary',
    assessment: 'secondary', offer: 'success', hired: 'success', rejected: 'destructive',
  };

  const statusColor: Record<string, string> = {
    draft: 'text-muted-foreground', open: 'text-success', paused: 'text-warning', closed: 'text-destructive',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruitment (ATS)</h1>
          <p className="text-muted-foreground mt-1">Applicant Tracking System</p>
        </div>
        <Button className="gap-2" onClick={() => navigate('/recruitment/new')}>
          <Plus className="h-4 w-4" /> Post New Job
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Job Listings */}
        <Card className="overflow-hidden lg:col-span-1 max-h-[calc(100vh-12rem)] overflow-y-auto">
          <CardHeader className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border/50 pb-4">
            <CardTitle className="flex items-center justify-between text-base">
              Positions <Badge variant="secondary" className="bg-primary/20 text-primary">{jobs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <div className="flex flex-col">
            {loadingJobs ? (
              [1, 2, 3].map(i => <div key={i} className="p-4 border-b border-border/50"><Skeleton className="h-12 w-full" /></div>)
            ) : jobs.length === 0 ? (
              <div className="p-6 text-center">
                <Briefcase className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No jobs posted yet</p>
              </div>
            ) : (
              jobs.map((job: any) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`p-4 border-b border-border/50 cursor-pointer transition-colors ${
                    activeJobId === job.id ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-primary/5 border-l-4 border-l-transparent'
                  }`}
                >
                  <h4 className={`font-semibold text-sm ${activeJobId === job.id ? 'text-primary' : ''}`}>{job.title}</h4>
                  <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                    <span className="uppercase">{(job as any).departments?.name || 'No dept'}</span>
                    <Badge variant="outline" className={`text-[10px] ${statusColor[job.status] || ''}`}>{job.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Pipeline */}
        <div className="lg:col-span-3 overflow-x-auto pb-4">
          {!activeJobId ? (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Select a job to view its pipeline</p>
              </CardContent>
            </Card>
          ) : loadingCandidates ? (
            <div className="flex gap-4 min-w-max">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-72"><Skeleton className="h-64 w-full" /></div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 min-w-max min-h-[500px]">
              {stages.filter(s => s !== 'rejected').map(stage => {
                const stageCandidates = candidates.filter((c: any) => c.stage === stage);
                return (
                  <div key={stage} className="w-72 flex-shrink-0 flex flex-col gap-3">
                    <div className="p-3 rounded border-t-2 border-border/50 bg-background/50 flex justify-between items-center" style={{ borderTopColor: `hsl(var(--${stageColors[stage] || 'primary'}))` }}>
                      <h3 className="text-sm tracking-wider uppercase text-muted-foreground">{stage}</h3>
                      <Badge variant="outline" className="rounded-full w-6 h-6 flex items-center justify-center p-0">
                        {stageCandidates.length}
                      </Badge>
                    </div>
                    <div className="flex-1 space-y-3">
                      {stageCandidates.map((c: any) => (
                        <Card key={c.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-sm">{c.full_name}</h4>
                              <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 text-muted-foreground">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{c.email}</p>
                            <div className="flex items-center justify-between text-xs">
                              <Badge variant="secondary" className="bg-primary/10 text-primary font-normal capitalize">
                                {c.source?.replace('_', ' ') || 'Direct'}
                              </Badge>
                              <span className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {stageCandidates.length === 0 && (
                        <div className="h-24 border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center text-muted-foreground text-sm opacity-50">
                          No candidates
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
