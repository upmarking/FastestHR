import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

interface EditScoreDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  candidateName: string;
  currentScore: number | null;
  jobId: string;
}

export function EditScoreDialog({
  isOpen,
  onOpenChange,
  candidateId,
  candidateName,
  currentScore,
  jobId,
}: EditScoreDialogProps) {
  const [score, setScore] = useState<string>(currentScore?.toString() || '');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      setScore(currentScore?.toString() || '');
    }
  }, [isOpen, currentScore]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('candidates')
        .update({ score: score ? parseFloat(score) : null })
        .eq('id', candidateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', jobId] });
      toast.success('Score updated successfully');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error updating score:', error);
      toast.error('Failed to update score');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Edit Candidate Score
          </DialogTitle>
          <DialogDescription>
            Update the assessment score for <strong>{candidateName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-score">Score (0.0 - 10.0)</Label>
            <Input
              id="edit-score"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="e.g. 8.5"
              autoFocus
              disabled={mutation.isPending}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mutation.isPending ? 'Updating...' : 'Update Score'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
