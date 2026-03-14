import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, PlayCircle, Clock, BookOpen, Star, ShieldCheck } from 'lucide-react';

export default function Learning() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Learning & Dev</h1>
          <p className="text-muted-foreground mt-1">Skill advancement & training</p>
        </div>
        <Button className="gap-2">
          <BookOpen className="h-4 w-4" /> BROWSE_CATALOG
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* User Stats */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground font-semibold gap-2 text-base">
              <GraduationCap className="w-5 h-5" /> LEARNER_PROFILE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Current Level</span>
                <span className="text-primary font-bold">L3 Engineer</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Training Hours YTD</span>
                <span className="text-info">42 Hours</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Certifications</span>
                <span className="text-success">3 Active</span>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border/50">
              <h4 className="text-xs font-medium uppercase text-muted-foreground tracking-wider mb-2">Required Compliance Training</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-warning" /> InfoSec 2026</span>
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-[10px] font-medium uppercase">Required</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={0} className="h-1.5 bg-secondary [&>div]:bg-warning" />
                  <span className="text-xs font-medium text-muted-foreground w-8">0%</span>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-success" /> Workplace Safety</span>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-[10px] font-medium uppercase">Valid</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={100} className="h-1.5 bg-secondary [&>div]:bg-success" />
                  <span className="text-xs font-medium text-muted-foreground w-8">100%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses List */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-sm text-muted-foreground uppercase tracking-wider">IN_PROGRESS_COURSES</h3>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'Advanced React Patterns', category: 'Engineering', progress: 65, timeRemaining: '2h 15m', instructor: 'Dan A.', img: 'bg-indigo-900/50' },
              { title: 'Effective Communication', category: 'Soft Skills', progress: 30, timeRemaining: '4h 30m', instructor: 'Internal HR', img: 'bg-emerald-900/50' },
            ].map((course, i) => (
              <Card key={i} className="overflow-hidden overflow-hidden group hover:border-primary/60 transition-colors">
                <div className={`h-24 ${course.img} relative flex items-center justify-center group-hover:bg-primary/20 transition-colors border-b border-border/50`}>
                  <PlayCircle className="w-10 h-10 text-white/70 group-hover:text-white group-hover:scale-110 transition-all cursor-pointer" />
                  <Badge className="absolute top-2 right-2 bg-black/50 text-white border-none backdrop-blur-md">{course.category}</Badge>
                </div>
                <CardContent className="p-4">
                  <h4 className="font-bold text-primary mb-1 line-clamp-1">{course.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 mb-4">
                    <Star className="w-3 h-3 text-warning" /> Instructor: {course.instructor}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-primary">{course.progress}% Completed</span>
                      <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {course.timeRemaining}</span>
                    </div>
                    <Progress value={course.progress} className="h-1.5 bg-primary/10" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <h3 className="text-sm text-muted-foreground uppercase tracking-wider mt-8 mb-4">RECOMMENDED_FOR_YOU</h3>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'Introduction to GraphQL', category: 'Engineering', duration: '5h 0m', level: 'Intermediate' },
              { title: 'Leadership 101 for Tech Leads', category: 'Management', duration: '12h 0m', level: 'Beginner' },
            ].map((course, i) => (
              <Card key={i} className="bg-background/40 border border-border/50 hover:border-border/50 transition-colors">
                <CardContent className="p-4 flex gap-4 items-center">
                  <div className="w-16 h-16 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-8 h-8 text-primary/50" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">{course.title}</h4>
                    <div className="flex gap-2 text-[10px] font-medium text-muted-foreground">
                      <Badge variant="outline" className="border-border/50">{course.level}</Badge>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
