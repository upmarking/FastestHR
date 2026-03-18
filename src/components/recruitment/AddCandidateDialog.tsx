import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth-store';

interface AddCandidateDialogProps {
  jobId: string;
}

export function AddCandidateDialog({ jobId }: AddCandidateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useAuthStore();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    phone: '',
    source: 'direct',
    score: '',
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!jobId || !profile?.company_id) throw new Error('Missing require info');
      const { data, error } = await supabase
        .from('candidates')
        .insert([
          {
            job_id: jobId,
            company_id: profile.company_id,
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone || null,
            source: formData.source,
            stage: 'applied',
            score: formData.score ? parseFloat(formData.score) : null,
          }
        ])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', jobId] });
      toast.success('Applicant added successfully');
      setIsOpen(false);
      setFormData({ fullName: '', email: '', phone: '', source: 'direct', score: '' });
    },
    onError: (error) => {
      console.error('Error adding applicant:', error);
      toast.error('Failed to add applicant');
    }
  });

  const handleClose = () => {
    setFormData({ fullName: '', email: '', phone: '', source: 'direct', score: '' });
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      toast.error('Please fill in required fields');
      return;
    }
    mutation.mutate();
  };

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={() => setIsOpen(true)}>
        <Users className="h-4 w-4" /> Add Applicant
      </Button>
      <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Applicant</DialogTitle>
          <DialogDescription>
            Add a new candidate manually to this job pipeline.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="John Doe"
              disabled={mutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              disabled={mutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 234 567 890"
              disabled={mutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Select
              value={formData.source}
              onValueChange={(value) => setFormData({ ...formData, source: value })}
              disabled={mutation.isPending}
            >
              <SelectTrigger id="source">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direct">Direct</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="indeed">Indeed</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="score">Score (0.0 - 10.0)</Label>
            <Input
              id="score"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: e.target.value })}
              placeholder="e.g. 8.5"
              disabled={mutation.isPending}
            />
          </div>
          <div className="flex justify-end pt-4 space-x-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mutation.isPending ? 'Adding...' : 'Add Applicant'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
