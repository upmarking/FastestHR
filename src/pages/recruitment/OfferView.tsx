import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Download, CheckCircle, XCircle } from 'lucide-react';
import { OfferLetterRenderer } from '@/components/recruitment/OfferLetterRenderer';

export default function OfferView() {
  const { token } = useParams<{ token: string }>();
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOffer() {
      if (!token) return;
      
      try {
        const { data, error: fetchError } = await supabase
          .from('candidate_offers')
          .select('*, companies(name, logo_url), candidates(full_name), jobs(title)')
          .eq('token', token)
          .single();

        if (fetchError || !data) {
          setError('Offer not found or link has expired.');
        } else {
          setOffer(data);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOffer();
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  const variables = useMemo(() => {
    if (!offer) return {};
    const joiningDate = offer.offer_data?.joiningDate || offer.joining_date;
    const payout = offer.offer_data?.payout || offer.payout;
    const formattedPayout = payout?.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    
    return {
      'Name': offer.candidates?.full_name || '',
      'candidate_name': offer.candidates?.full_name || '',
      'Designation': offer.jobs?.title || '',
      'job_title': offer.jobs?.title || '',
      'Joined Date': joiningDate || '',
      'Payout': formattedPayout || '',
      'Offer Number': offer.offer_number || '',
      'offer_number': offer.offer_number || ''
    };
  }, [offer]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse font-mono uppercase tracking-widest text-xs">Authenticating Offer Token...</p>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="bg-background border border-destructive/20 p-8 rounded-lg shadow-2xl max-w-md text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Offer Unavailable</h2>
          <p className="text-muted-foreground">{error || 'The offer link you followed is invalid.'}</p>
          <Button variant="outline" className="mt-6 w-full" onClick={() => window.location.href = '/'}>
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white text-slate-900">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Actions Bar (Hidden on print) */}
        <div className="flex justify-between items-center bg-background/80 backdrop-blur-md p-4 rounded-xl border border-border/50 shadow-lg sticky top-6 z-10 print:hidden">
          <div className="flex items-center gap-4 text-foreground">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none">{offer.jobs?.title}</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{offer.companies?.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
              <Download className="h-4 w-4" /> Print / Save PDF
            </Button>
          </div>
        </div>

        {/* Offer Letter Content */}
        <OfferLetterRenderer 
          htmlContent={offer.html_content}
          variables={variables}
          letterheadUrl={offer.letterhead_url}
          isPredefinedHtml={offer.is_predefined_html}
        />

        {/* Footer (Hidden on print) */}
        <div className="text-center pb-12 print:hidden">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Offered via <span className="text-primary font-bold">FastestHR</span> Autonomous Recruitment System
          </p>
        </div>
      </div>
    </div>
  );
}
