import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Users, Plus, Loader2, Send, Star, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { useState, useEffect } from 'react';
import { AddCandidateDialog } from '@/components/recruitment/AddCandidateDialog';
import { CandidateActions } from '@/components/recruitment/CandidateActions';
import { JobActions } from '@/components/recruitment/JobActions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OfferTemplateList } from '@/components/recruitment/OfferTemplateEditor';
import { EditScoreDialog } from '@/components/recruitment/EditScoreDialog';


const STAGE_COLORS: Record<string, string> = {
  applied: 'bg-blue-500',
  screening: 'bg-yellow-500',
  interview: 'bg-purple-500',
  assessment: 'bg-indigo-500',
  offer: 'bg-orange-500',
  hired: 'bg-green-500',
  rejected: 'bg-red-500',
};

const DEFAULT_STAGES = [
  'applied',
  'screening',
  'interview',
  'assessment',
  'offer',
  'hired'
];

export default function Recruitment() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [activeJob, setActiveJob] = useState<string | null>(null);
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading: loadingJobs } = useQuery({
    queryKey: ['jobs', profile?.company_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('jobs')
        .select('*, departments(name)')
        .eq('company_id', profile!.company_id!)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  // Automatically select the first job if none selected
  useEffect(() => {
    if (jobs.length > 0 && !activeJob) {
      setActiveJob(jobs[0].id);
    }
  }, [jobs, activeJob]);

  const activeJobData = jobs.find(j => j.id === activeJob);
  const currentPipelineStages = (activeJobData as any)?.pipeline_stages || DEFAULT_STAGES;

  const pipelineStages = currentPipelineStages.map((s: string) => ({
    id: s,
    name: s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' '),
    color: STAGE_COLORS[s] || 'bg-slate-500'
  }));

  const { data: candidates = [], isLoading: loadingCandidates } = useQuery({
    queryKey: ['candidates', activeJob],
    queryFn: async () => {
      const { data } = await supabase
        .from('candidates')
        .select('*')
        .eq('job_id', activeJob!)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!activeJob,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Recruitment</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage job postings and candidate pipeline</p>
        </div>
        <div className="flex gap-3">
          {activeJob && (
            <AddCandidateDialog 
              jobId={activeJob} 
            />
          ) as any}
        </div>
      </div>

      <Tabs defaultValue="pipeline" className="space-y-6">
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="pipeline" className="gap-2">
            <Users className="h-4 w-4" /> Pipeline
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Send className="h-4 w-4" /> Offer Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Jobs List */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="bg-background/50 border-border/50 backdrop-blur-sm h-full">
                <CardHeader className="pb-3 border-b border-border/10 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Active Jobs</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-primary hover:bg-primary/10"
                    onClick={() => navigate('/recruitment/new')}
                    title="New Job"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-2 space-y-1">
                  {loadingJobs ? (
                    [1, 2, 3].map(i => <div key={i} className="p-4"><Skeleton className="h-10 w-full" /></div>)
                  ) : jobs.length === 0 ? (
                    <div className="p-6 text-center">
                      <Briefcase className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No jobs posted yet</p>
                    </div>
                  ) : (
                    jobs.map((job) => (
                      <div
                        key={job.id}
                        onClick={() => setActiveJob(job.id)}
                        className={`group relative w-full flex items-center justify-between p-3 rounded-md cursor-pointer transition-all duration-200 ${
                          activeJob === job.id 
                            ? 'bg-primary/10 border border-primary/20 shadow-sm' 
                            : 'hover:bg-muted/50 border border-transparent'
                        }`}
                      >
                        <div className="flex-1 min-w-0 pr-8">
                          <p className={`font-semibold text-sm truncate ${activeJob === job.id ? 'text-primary' : 'text-foreground'}`}>
                            {job.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {(job as any).departments?.name || 'General'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/recruitment/edit/${job.id}`);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" /> 
                            <span className="sr-only">Edit Job</span>
                          </Button>
                          <JobActions 
                            jobId={job.id} 
                            onDeleted={() => {
                              if (activeJob === job.id) setActiveJob(null);
                            }} 
                          />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Pipeline */}
            <div className="lg:col-span-3">
              {activeJob ? (
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {loadingCandidates ? (
                    [1, 2, 3].map(i => (
                      <div key={i} className="flex-shrink-0 w-80 space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-64 w-full" />
                      </div>
                    ))
                  ) : (
                    pipelineStages.map((stage: any) => (
                      <div key={stage.id} className="flex-shrink-0 w-80 space-y-4">
                        <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                            <h3 className="font-semibold text-sm uppercase tracking-wider">{stage.name}</h3>
                            <Badge variant="secondary" className="text-[10px] bg-muted/50 border-none">
                              {candidates.filter(c => c.stage === stage.id).length}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-3 min-h-[500px] p-2 rounded-lg bg-muted/30 border border-dashed border-border/50">
                          {candidates
                            .filter(c => c.stage === stage.id)
                            .map((candidate) => (
                              <Card key={candidate.id} className="bg-background border-border/50 shadow-sm hover:border-primary/50 transition-colors group relative">
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-10 w-10 border border-border/50">
                                        <AvatarImage src={(candidate as any).avatar_url} />
                                        <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold uppercase">
                                          {candidate.full_name?.split(' ').map((n: string) => n[0]).join('')}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-semibold text-sm text-foreground">{candidate.full_name}</p>
                                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                          <Send className="h-3 w-3" />
                                          {candidate.source || 'Direct'}
                                        </p>
                                      </div>
                                    </div>
                                    <CandidateActions 
                                      candidateId={candidate.id} 
                                      jobId={activeJob} 
                                      currentStage={candidate.stage}
                                      pipelineStages={currentPipelineStages}
                                      candidateName={candidate.full_name}
                                      score={candidate.score}
                                    />
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-1.5">
                                    {candidate.score !== null ? (
                                      <Badge 
                                        variant="secondary" 
                                        className="text-[10px] font-normal border-none bg-muted/60 cursor-pointer hover:bg-primary/20 transition-colors"
                                        onClick={() => {
                                          setSelectedCandidate(candidate);
                                          setIsScoreDialogOpen(true);
                                        }}
                                      >
                                        <Star className="h-3 w-3 mr-1 text-primary fill-primary/20" />
                                        {candidate.score} Score
                                      </Badge>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-[10px] text-muted-foreground hover:text-primary gap-1 lowercase"
                                        onClick={() => {
                                          setSelectedCandidate(candidate);
                                          setIsScoreDialogOpen(true);
                                        }}
                                      >
                                        <Plus className="h-3 w-3" />
                                        add score
                                      </Button>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          {candidates.filter(c => c.stage === stage.id).length === 0 && (
                            <div className="h-32 flex flex-col items-center justify-center text-muted-foreground/30 border-2 border-dashed border-muted-foreground/5 rounded-lg">
                              <Users className="h-6 w-6 mb-1" />
                              <p className="text-[10px] font-medium uppercase tracking-tighter">No Candidates</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center min-h-[400px] bg-muted/10 rounded-lg border border-dashed border-border/50">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Select a job position to view its pipeline</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <OfferTemplateList />
        </TabsContent>
      </Tabs>
      
      {selectedCandidate && (
        <EditScoreDialog
          isOpen={isScoreDialogOpen}
          onOpenChange={setIsScoreDialogOpen}
          candidateId={selectedCandidate.id}
          candidateName={selectedCandidate.full_name}
          currentScore={selectedCandidate.score}
          jobId={activeJob!}
        />
      )}
    </div>
  );
}
