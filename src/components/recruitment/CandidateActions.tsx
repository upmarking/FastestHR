import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, ArrowRight, XCircle, Trash2, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { OfferDetailsDialog } from './OfferDetailsDialog';
import { generateAndUploadOfferPDF, replaceHtmlVariables } from '@/lib/pdf-generator';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

interface CandidateActionsProps {
  candidateId: string;
  jobId: string;
  currentStage: string;
  pipelineStages?: string[];
}

export function CandidateActions({ candidateId, jobId, currentStage, pipelineStages = [] }: CandidateActionsProps) {
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [candidate, setCandidate] = useState<{ full_name: string } | null>(null);
  const [pendingStage, setPendingStage] = useState<string | null>(null);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [existingOffer, setExistingOffer] = useState<{ joining_date: string, payout: number } | null>(null);

  const executeAutomations = async (newStage: string, offerData?: { joiningDate: string; payout: number }) => {
    try {
      // Fetch job settings to get automations
      const { data: job, error } = await supabase
        .from('jobs')
        .select('stage_automations, company_id')
        .eq('id', jobId)
        .single();

      if (error || !job) return;

      let automations = (job as any).stage_automations?.[newStage];
      
      // If moving to offer, we inherently need to send the offer
      if (newStage === 'offer' && offerData) {
        automations = automations || {};
        automations.send_email = true;
      }

      if (!automations) return;

      if (automations.send_email && newStage === 'offer' && offerData) {
        // Resolve offer_template_id from automation config
        const templateId = automations.offer_template_id;
        if (!templateId) {
          toast.error('No offer template configured! Go to Job Settings → Stage Automation → Offer to set one.');
          return;
        }

        toast.info('Automation: Generating offer letter PDF...');
        
        // 1. Fetch required data for PDF (including email_subject and email_body from template)
        const { data: template } = await (supabase.from('offer_templates' as any) as any).select('*').eq('id', templateId).single();
        const { data: candidateInfo } = await supabase.from('candidates').select('full_name, email').eq('id', candidateId).single();
        const { data: jobInfo } = await supabase.from('jobs').select('title').eq('id', jobId).single();
        const { data: companyInfo } = await supabase.from('companies').select('offer_sequence_prefix').eq('id', (job as any).company_id).single() as any;
        
        if (!template) {
          toast.error('Offer template not found. Please check your template configuration.');
          return;
        }

        // 2. Fetch Offer Sequence
        const { data: offerSequence } = await supabase.rpc('increment_offer_sequence', { p_company_id: (job as any).company_id });
        const offerNumberStr = `${companyInfo?.offer_sequence_prefix || 'OFFER-'}${offerSequence?.toString().padStart(4, '0')}`;
        
        const rawHtml = template.html_content;
        
        // 3. Generate and Upload PDF
        const pdfPath = await generateAndUploadOfferPDF({
          htmlContent: rawHtml,
          letterheadUrl: template.letterhead_url,
          candidateName: candidateInfo!.full_name,
          jobTitle: jobInfo!.title,
          joiningDate: offerData.joiningDate,
          payout: offerData.payout,
          offerNumber: offerNumberStr,
          companyId: (job as any).company_id,
          candidateId: candidateId
        });

        // 4. Get the final HTML string for inline preview
        const finalHtml = replaceHtmlVariables(rawHtml, {
          candidateName: candidateInfo!.full_name,
          jobTitle: jobInfo!.title,
          joiningDate: offerData.joiningDate,
          payout: offerData.payout,
          offerNumber: offerNumberStr,
        });

        toast.info('Sending offer letter email with attachment...');
        
        const { data, error: fnError } = await supabase.functions.invoke('send-offer-letter', {
          body: { 
            candidate_id: candidateId, 
            job_id: jobId, 
            company_id: (job as any).company_id,
            offer_data: offerData,
            html_content: finalHtml,
            pdf_path: pdfPath,
            offer_number: offerNumberStr,
            template_id: templateId
          }
        });
        
        if (fnError || data?.error) {
          console.error('Edge function error:', fnError || data?.error);
          toast.error(`Failed to send offer letter: ${data?.error || fnError?.message}`);
        } else {
          toast.success('Offer letter sent successfully!');
        }
      } else if (automations.send_email) {
        toast.info(`Automation: Sending ${(automations.email_template || 'notification').replace(/_/g, ' ')} email...`);
        // generic email automation logic (mocked for now as per existing)
      }

      if (automations.notify_team) {
        toast.info(`Automation: Notifying hiring team...`);
      }
    } catch (err) {
      console.error('Automation error:', err);
    }
  };

  const updateStageMutation = useMutation({
    mutationFn: async (newStage: string) => {
      const { error } = await supabase
        .from('candidates')
        .update({ stage: newStage as any })
        .eq('id', candidateId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidates', jobId] });
      toast.success(`Candidate moved to ${variables}`);
      if (variables !== 'offer') {
        executeAutomations(variables);
      }
    },
    onError: (error) => {
      console.error('Error updating stage:', error);
      toast.error('Failed to update candidate stage');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', jobId] });
      toast.success('Candidate deleted successfully');
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error deleting candidate:', error);
      toast.error('Failed to delete candidate');
    }
  });

  const handleMoveNext = async () => {
    if (currentStage === 'hired' || currentStage === 'rejected') return;
    const currentIndex = pipelineStages.indexOf(currentStage);
    const nextStage = pipelineStages[currentIndex + 1];
    
    if (nextStage === 'offer') {
      // Fetch candidate info for the dialog
      const { data } = await supabase.from('candidates').select('full_name').eq('id', candidateId).single();
      setCandidate(data);
      setPendingStage(nextStage);
      setIsOfferDialogOpen(true);
    } else if (nextStage && nextStage !== 'rejected') {
      updateStageMutation.mutate(nextStage);
    }
  };

  const handleOfferConfirm = async (offerData: { joiningDate: string; payout: number }) => {
    setIsSubmittingOffer(true);
    try {
      await executeAutomations(pendingStage || currentStage, offerData);
      
      // Update the stage if we are moving forward, not if we are just resending
      if (pendingStage && pendingStage !== currentStage) {
        await updateStageMutation.mutateAsync(pendingStage!);
      } else {
        queryClient.invalidateQueries({ queryKey: ['candidates', jobId] });
      }
      
      setIsOfferDialogOpen(false);
      setExistingOffer(null);
      setPendingStage(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to process offer letter.');
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const handleResendOffer = async () => {
    try {
      const { data: candData } = await supabase.from('candidates').select('full_name').eq('id', candidateId).single();
      setCandidate(candData);

      const { data: offerData } = await supabase
        .from('candidate_offers')
        .select('joining_date, payout')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (offerData) {
        setExistingOffer({
          joining_date: offerData.joining_date || '',
          payout: offerData.payout || 0,
        });
      }
      
      setPendingStage(null);
      setIsOfferDialogOpen(true);
    } catch (err) {
      console.error('Error fetching existing offer:', err);
      toast.error('Failed to prepare offer resend.');
    }
  };

  const isNextDisabled = currentStage === 'hired' || currentStage === 'rejected' || updateStageMutation.isPending;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 text-muted-foreground">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleMoveNext} disabled={isNextDisabled}>
            <ArrowRight className="mr-2 h-4 w-4" />
            Move to Next Step
          </DropdownMenuItem>
          {currentStage === 'offer' && (
            <DropdownMenuItem onClick={handleResendOffer} disabled={updateStageMutation.isPending}>
              <Send className="mr-2 h-4 w-4" />
              Resend Offer Letter
            </DropdownMenuItem>
          )}
          <DropdownMenuItem 
            onClick={() => updateStageMutation.mutate('rejected' as any)}
            disabled={currentStage === 'rejected' || updateStageMutation.isPending}
            className="text-warning focus:text-warning"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Reject
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Candidate
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              candidate's profile and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <OfferDetailsDialog 
        isOpen={isOfferDialogOpen}
        onClose={() => {
          setIsOfferDialogOpen(false);
          setExistingOffer(null);
        }}
        candidateName={candidate?.full_name || 'Candidate'}
        onConfirm={handleOfferConfirm}
        isSubmitting={isSubmittingOffer}
        defaultJoiningDate={existingOffer?.joining_date}
        defaultPayout={existingOffer?.payout}
      />
    </>
  );
}
