import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, PlayCircle, Clock, BookOpen, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Learning() {
  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ['course-enrollments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('course_enrollments')
        .select('*, courses(title, category, thumbnail_url, duration_minutes)')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const inProgress = enrollments.filter((e: any) => e.status === 'in_progress');
  const completed = enrollments.filter((e: any) => e.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning & Dev</h1>
          <p className="text-muted-foreground mt-1">Skill advancement & training</p>
        </div>
        <Button className="gap-2">
          <BookOpen className="h-4 w-4" /> Browse Catalog
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="w-5 h-5" /> Learning Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Courses Available</span>
              <span className="font-bold text-primary">{courses.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">In Progress</span>
              <span className="font-bold text-warning">{inProgress.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-bold text-success">{completed.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Courses */}
        <div className="md:col-span-2 space-y-4">
          {inProgress.length > 0 && (
            <>
              <h3 className="text-sm text-muted-foreground uppercase tracking-wider">In Progress</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {inProgress.map((enrollment: any) => (
                  <Card key={enrollment.id} className="overflow-hidden group hover:border-primary/60 transition-colors">
                    <div className="h-24 bg-primary/10 relative flex items-center justify-center border-b border-border/50">
                      <PlayCircle className="w-10 h-10 text-primary/50 group-hover:text-primary group-hover:scale-110 transition-all cursor-pointer" />
                      {enrollment.courses?.category && (
                        <Badge className="absolute top-2 right-2 bg-background/80 text-foreground border-none backdrop-blur-md text-[10px]">
                          {enrollment.courses.category}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-bold text-primary mb-1 line-clamp-1">{enrollment.courses?.title || 'Course'}</h4>
                      {enrollment.courses?.duration_minutes && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-4">
                          <Clock className="w-3 h-3" /> {Math.round(enrollment.courses.duration_minutes / 60)}h {enrollment.courses.duration_minutes % 60}m
                        </p>
                      )}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-primary">{enrollment.progress || 0}% Completed</span>
                        </div>
                        <Progress value={enrollment.progress || 0} className="h-1.5 bg-primary/10" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          <h3 className="text-sm text-muted-foreground uppercase tracking-wider mt-6">Course Catalog</h3>
          {loadingCourses ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : courses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-8">
                <BookOpen className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No courses available yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {courses.map((course: any) => (
                <Card key={course.id} className="bg-background/40 border border-border/50 hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex gap-4 items-center">
                    <div className="w-16 h-16 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-8 h-8 text-primary/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-1 truncate">{course.title}</h4>
                      <div className="flex gap-2 text-[10px] text-muted-foreground">
                        {course.category && <Badge variant="outline" className="border-border/50">{course.category}</Badge>}
                        {course.duration_minutes && (
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.round(course.duration_minutes / 60)}h</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
