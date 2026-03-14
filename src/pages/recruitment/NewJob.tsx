import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Briefcase, Loader2, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';

const JOB_TYPES = ['full_time', 'part_time', 'contract', 'intern', 'remote'] as const;
const JOB_STATUS = ['open', 'closed', 'paused', 'draft'] as const;
const EXPERIENCE_LEVELS = ['entry', 'mid', 'senior', 'lead', 'manager'] as const;

export default function NewJob() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuthStore();

  const [form, setForm] = useState({
    title: '',
    department: '',
    location: '',
    type: 'full_time' as typeof JOB_TYPES[number],
    experience_level: 'mid' as typeof EXPERIENCE_LEVELS[number],
    status: 'open' as typeof JOB_STATUS[number],
    description: '',
    requirements: '',
    min_salary: '',
    max_salary: '',
    openings: '1',
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .insert([
          {
            company_id: profile?.company_id,
            title: form.title,
            department: form.department || null,
            location: form.location || null,
            type: form.type,
            experience_level: form.experience_level,
            status: form.status,
            description: form.description || null,
            requirements: form.requirements || null,
            min_salary: form.min_salary ? parseFloat(form.min_salary) : null,
            max_salary: form.max_salary ? parseFloat(form.max_salary) : null,
            openings: parseInt(form.openings) || 1,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['open-jobs'] });
      toast.success('SYSTEM::JOB_POSTED — Job listing is now live');
      navigate('/recruitment');
    },
    onError: (err: any) => {
      toast.error('ERROR::' + (err?.message || 'Failed to post job'));
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('ERROR::JOB_TITLE_REQUIRED');
      return;
    }
    createMutation.mutate();
  };

  const Field = ({ label, name, type = 'text', required = false, placeholder = '' }: {
    label: string; name: string; type?: string; required?: boolean; placeholder?: string;
  }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <Input
        type={type}
        name={name}
        value={(form as any)[name]}
        onChange={handleChange}
        required={required}
        placeholder={placeholder}
        className="bg-background/50 border-border/50 text-sm h-10 focus:border-primary"
      />
    </div>
  );

  const SelectField = ({ label, name, options }: {
    label: string; name: string; options: { value: string; label: string }[];
  }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <select
        name={name}
        value={(form as any)[name]}
        onChange={handleChange}
        className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/recruitment')}
          className="border border-border/50 hover:border-primary hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Plus className="h-6 w-6" /> Post New Job
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">RECRUITMENT::NEW_JOB_LISTING</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-foreground font-semibold text-base flex items-center gap-2">
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5">01</span>
              JOB_DETAILS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Job Title" name="title" required placeholder="Senior Frontend Engineer" />
            </div>
            <Field label="Department" name="department" placeholder="Engineering" />
            <Field label="Location" name="location" placeholder="Remote / New York, NY" />
            <SelectField
              label="Job Type"
              name="type"
              options={JOB_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }))}
            />
            <SelectField
              label="Experience Level"
              name="experience_level"
              options={EXPERIENCE_LEVELS.map((e) => ({ value: e, label: e.replace(/\b\w/g, c => c.toUpperCase()) }))}
            />
            <SelectField
              label="Status"
              name="status"
              options={JOB_STATUS.map((s) => ({ value: s, label: s.replace(/\b\w/g, c => c.toUpperCase()) }))}
            />
            <Field label="Number of Openings" name="openings" type="number" placeholder="1" />
          </CardContent>
        </Card>

        {/* Compensation */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-foreground font-semibold text-base flex items-center gap-2">
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5">02</span>
              COMPENSATION_RANGE
            </CardTitle>
            <CardDescription className="text-xs font-medium">Optional salary band (annual, in USD)</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 grid sm:grid-cols-2 gap-4">
            <Field label="Min Salary ($)" name="min_salary" type="number" placeholder="80000" />
            <Field label="Max Salary ($)" name="max_salary" type="number" placeholder="120000" />
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-foreground font-semibold text-base flex items-center gap-2">
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5">03</span>
              JOB_DESCRIPTION
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Job Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Describe the role, responsibilities, and what the candidate will work on..."
                className="flex w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-y"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Requirements</label>
              <textarea
                name="requirements"
                value={form.requirements}
                onChange={handleChange}
                rows={4}
                placeholder="List key skills, qualifications, and experience required..."
                className="flex w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-y"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/recruitment')}
            className="border-border/50 hover:border-primary/50 transition-all"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> CANCEL
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="gap-2 min-w-[160px]"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {createMutation.isPending ? 'POSTING...' : 'POST_JOB'}
          </Button>
        </div>
      </form>
    </div>
  );
}
