import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Users, Plus, PhoneCall, Check, X, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Recruitment() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Recruitment (ATS)</h1>
          <p className="text-muted-foreground mt-1">Applicant Tracking System</p>
        </div>
        <Button className="gap-2" onClick={() => navigate('/recruitment/new')}>
          <Plus className="h-4 w-4" /> POST_NEW_JOB
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Job Listings Sidebar */}
        <Card className="overflow-hidden lg:col-span-1 border-r border-r-primary/20 rounded-none lg:rounded-l-lg h-[calc(100vh-12rem)] overflow-y-auto">
          <CardHeader className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border/50 pb-4">
            <CardTitle className="flex items-center text-foreground font-semibold justify-between text-base">
              OPEN_POSITIONS <Badge variant="secondary" className="bg-primary/20 text-primary">3</Badge>
            </CardTitle>
          </CardHeader>
          <div className="flex flex-col">
            {[
              { id: 1, title: 'Senior Frontend Engineer', dept: 'Engineering', applicants: 45, isSelected: true },
              { id: 2, title: 'Product Manager', dept: 'Product', applicants: 12, isSelected: false },
              { id: 3, title: 'HR Generalist', dept: 'Operations', applicants: 89, isSelected: false },
            ].map(job => (
              <div 
                key={job.id} 
                className={`p-4 border-b border-border/50 cursor-pointer transition-colors ${
                  job.isSelected ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-primary/5 border-l-4 border-l-transparent'
                }`}
              >
                <h4 className={`font-mono font-semibold ${job.isSelected ? 'text-primary' : ''}`}>{job.title}</h4>
                <div className="flex justify-between items-center mt-2 text-xs font-medium text-muted-foreground">
                  <span className="uppercase">{job.dept}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {job.applicants}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Pipeline Board */}
        <div className="lg:col-span-3 overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max h-full min-h-[500px]">
            {[
              { 
                stage: 'APPLIED', count: 2, color: 'info', 
                candidates: [
                  { name: 'Sarah Connor', role: 'Sr. React Dev', score: 85, time: '2d ago' },
                  { name: 'John Doe', role: 'Full Stack', score: 72, time: '5d ago' },
                ] 
              },
              { 
                stage: 'SCREENING', count: 1, color: 'warning', 
                candidates: [
                  { name: 'Alice Smith', role: 'Frontend Lead', score: 91, time: '1w ago' },
                ] 
              },
              { 
                stage: 'INTERVIEW', count: 1, color: 'primary', 
                candidates: [
                  { name: 'Bob Johnson', role: 'React Engineer', score: 88, time: 'Today' },
                ] 
              },
              { 
                stage: 'OFFERED', count: 0, color: 'success', 
                candidates: [] 
              },
            ].map(column => (
              <div key={column.stage} className="w-80 flex-shrink-0 flex flex-col gap-3">
                <div className={`p-3 rounded border-t-2 border-${column.color} bg-background/50 border-x border-b border-border/50 flex justify-between items-center`}>
                  <h3 className="text-sm tracking-wider uppercase text-muted-foreground">{column.stage}</h3>
                  <Badge variant="outline" className={`bg-${column.color}/10 text-${column.color} border-${column.color}/30 rounded-full w-6 h-6 flex items-center justify-center p-0`}>
                    {column.count}
                  </Badge>
                </div>
                
                <div className="flex-1 space-y-3">
                  {column.candidates.map((c, i) => (
                    <Card key={i} className="overflow-hidden hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm">{c.name}</h4>
                          <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 text-muted-foreground hover:text-primary">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground mb-3">{c.role}</p>
                        
                        <div className="flex items-center justify-between text-xs">
                          <Badge variant="secondary" className="bg-primary/10 text-primary font-normal">
                            A.I. Score: {c.score}%
                          </Badge>
                          <span className="text-muted-foreground">{c.time}</span>
                        </div>
                        
                        {column.stage === 'INTERVIEW' && (
                          <div className="mt-3 pt-3 border-t border-border/50 flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 h-7 text-xs bg-success/10 text-success border-success/30 hover:bg-success/20 hover:text-success">
                              <Check className="w-3 h-3 mr-1" /> Pass
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 h-7 text-xs bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20 hover:text-destructive">
                              <X className="w-3 h-3 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {column.candidates.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center text-muted-foreground text-sm opacity-50">
                      Drop Here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
