import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GraduationCap, PlayCircle, Clock, BookOpen, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { useState } from 'react';
import { toast } from 'sonner';

interface CourseForm {
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
}
const emptyCourseForm: CourseForm = { title: '', description: '', category: '', duration_minutes: 60 };

export default function Learning() {
  const { profile } = useAuthStore();
  const queryClient = useQueryClient();
  const isAdmin = profile?.platform_role === 'company_admin' || profile?.platform_role === 'super_admin';
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CourseForm>(emptyCourseForm);

  const { data: employee } = useQuery({
    queryKey: ['my-employee', profile?.id],
    queryFn: async () => {
      const { data } = await supabase.from('employees').select('id').eq('user_id', profile!.id).is('deleted_at', null).maybeSingle();
      return data;
    },
    enabled: !!profile?.id,
  });

  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ['courses', profile?.company_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('company_id', profile!.company_id!)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ['course-enrollments', employee?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('course_enrollments')
        .select('*, courses(title, category, thumbnail_url, duration_minutes)')
        .eq('employee_id', employee!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!employee?.id,
  });

  const createCourseMutation = useMutation({
    mutationFn: async (f: CourseForm) => {
      const { error } = await supabase.from('courses').insert([{
        company_id: profile!.company_id!,
        title: f.title,
        description: f.description,
        category: f.category,
        duration_minutes: f.duration_minutes,
        created_by: profile!.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course created');
      setDialogOpen(false);
      setForm(emptyCourseForm);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create course'),
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!employee) throw new Error('Employee not found');
      const { error } = await supabase.from('course_enrollments').insert([{
        course_id: courseId,
        employee_id: employee.id,
        status: 'enrolled' as any,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-enrollments'] });
      toast.success('Enrolled successfully');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to enroll'),
  });

  const enrolledCourseIds = enrollments.map((e: any) => e.course_id);
  const inProgress = enrollments.filter((e: any) => e.status === 'in_progress');
  const completed = enrollments.filter((e: any) => e.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning & Dev</h1>
          <p className="text-muted-foreground mt-1">Skill advancement & training</p>
        </div>
        {isAdmin ? (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Create Course</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create a New Course</DialogTitle>
                <DialogDescription>Add a training course for your team</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Course Title</Label>
                  <Input placeholder="e.g., Leadership Essentials" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="What will participants learn?" rows={3} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leadership">Leadership</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="soft_skills">Soft Skills</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="onboarding">Onboarding</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input type="number" min={5} value={form.duration_minutes} onChange={(e) => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 60 }))} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => { if (!form.title.trim()) { toast.error('Title is required'); return; } createCourseMutation.mutate(form); }} disabled={createCourseMutation.isPending}>
                  {createCourseMutation.isPending ? 'Creating...' : 'Create Course'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Button className="gap-2"><BookOpen className="h-4 w-4" /> Browse Catalog</Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
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
              {courses.map((course: any) => {
                const isEnrolled = enrolledCourseIds.includes(course.id);
                return (
                  <Card key={course.id} className="bg-background/40 border border-border/50 hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 flex gap-4 items-center">
                      <div className="w-16 h-16 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-8 h-8 text-primary/50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm mb-1 truncate">{course.title}</h4>
                        <div className="flex gap-2 text-[10px] text-muted-foreground mb-2">
                          {course.category && <Badge variant="outline" className="border-border/50">{course.category}</Badge>}
                          {course.duration_minutes && (
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.round(course.duration_minutes / 60)}h</span>
                          )}
                        </div>
                        {!isAdmin && (
                          <Button size="sm" variant={isEnrolled ? 'secondary' : 'default'} className="h-7 text-xs" disabled={isEnrolled || enrollMutation.isPending} onClick={() => enrollMutation.mutate(course.id)}>
                            {isEnrolled ? 'Enrolled ✓' : 'Enroll'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
