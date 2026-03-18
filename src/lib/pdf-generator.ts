import { supabase } from '@/integrations/supabase/client';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface GenerateOfferParams {
  htmlContent: string;
  letterheadUrl?: string | null;
  candidateName: string;
  jobTitle: string;
  joiningDate: string;
  payout: number;
  offerNumber: string;
  companyId: string;
  candidateId: string;
  isPredefinedHtml?: boolean;
}

/**
 * Replaces template variables in HTML content with actual values.
 */
function substituteVariables(html: string, vars: Record<string, string>): string {
  let result = html;
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(key).join(value);
  }
  return result;
}

/**
 * Builds the variable map from offer parameters.
 */
function buildVariableMap(params: {
  candidateName: string;
  jobTitle: string;
  joiningDate: string;
  payout: number;
  offerNumber: string;
}): Record<string, string> {
  const formattedPayout = params.payout.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return {
    '{{Name}}': params.candidateName,
    '{{candidate_name}}': params.candidateName,
    '{{first_name}}': params.candidateName.split(' ')[0],
    '{{Designation}}': params.jobTitle,
    '{{job_title}}': params.jobTitle,
    '{{Joined Date}}': params.joiningDate,
    '{{Payout}}': formattedPayout,
    '{{Offer Number}}': params.offerNumber,
    '{{offer_number}}': params.offerNumber,
  };
}

/**
 * Builds the DOM element for predefined HTML mode.
 * No system styles, no padding, no letterhead, no wrapper divs.
 * The user's HTML is injected as-is — identical to how OfferLetterRenderer renders it in preview.
 */
function buildPredefinedHtmlElement(html: string): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el;
}

/**
 * Builds the DOM element for raw/standard HTML mode.
 * Applies system layout: letterhead image, padding, typography styles.
 */
function buildRawHtmlElement(html: string, letterheadUrl?: string | null): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText =
    'width:210mm;min-height:297mm;padding:0;margin:0;background-color:white;color:#1e293b;font-family:sans-serif;';

  let letterheadBlock = '';
  if (letterheadUrl) {
    letterheadBlock = `
      <div style="width:100%;max-height:150px;overflow:hidden;display:flex;justify-content:center;background-color:white;">
        <img src="${letterheadUrl}" style="width:100%;object-fit:contain;max-height:150px;" crossorigin="anonymous" />
      </div>`;
  }

  el.innerHTML = `
    <div style="background-color:white;">
      ${letterheadBlock}
      <div style="padding:40px 60px;line-height:1.6;">
        <style>
          h1 { font-size:28pt; font-weight:800; color:#0f172a; border-bottom:2pt solid #f1f5f9; padding-bottom:15pt; margin-bottom:30pt; font-family:sans-serif; }
          h2 { font-size:18pt; font-weight:700; color:#1e293b; margin-top:25pt; margin-bottom:12pt; font-family:sans-serif; }
          p  { font-size:11pt; color:#334155; margin-bottom:15pt; line-height:1.6; font-family:sans-serif; }
          table { width:100%; border-collapse:collapse; margin:20pt 0; }
          th, td { border:1px solid #e2e8f0; padding:10pt; text-align:left; font-size:10pt; }
          th { background-color:#f8fafc; font-weight:600; color:#475569; }
        </style>
        ${html}
      </div>
    </div>`;

  return el;
}

/**
 * Main: generates a PDF blob from offer HTML, uploads it to Supabase Storage, returns the path.
 */
export async function generateAndUploadOfferPDF(params: GenerateOfferParams): Promise<string> {
  const { htmlContent, letterheadUrl, companyId, candidateId, candidateName, isPredefinedHtml = false } = params;

  // 1. Replace template variables
  const vars = buildVariableMap(params);
  const finalHtml = substituteVariables(htmlContent, vars);

  // 2. Build the source element — completely different paths for each mode
  const pdfElement = isPredefinedHtml
    ? buildPredefinedHtmlElement(finalHtml)
    : buildRawHtmlElement(finalHtml, letterheadUrl);

  // 3. Configure html2pdf options — zero margin for predefined, 10mm for raw
  const opt = {
    margin: (isPredefinedHtml ? [0, 0, 0, 0] : [10, 10, 10, 10]) as [number, number, number, number],
    filename: `Offer-${candidateName.replace(/\s+/g, '-')}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
  };

  // 4. Generate PDF blob
  const pdfBlob: Blob = await html2pdf().set(opt).from(pdfElement).output('blob');

  // 5. Upload to Supabase Storage
  const fileName = `${companyId}/${candidateId}_offer_${Date.now()}.pdf`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('offer_letters')
    .upload(fileName, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload PDF: ${uploadError.message}`);
  }

  return uploadData.path;
}

/**
 * Utility: replaces variables in HTML without generating a PDF.
 * Used by CandidateActions to get the final HTML for inline storage.
 */
export function replaceHtmlVariables(
  htmlContent: string,
  params: Omit<GenerateOfferParams, 'htmlContent' | 'companyId' | 'candidateId' | 'letterheadUrl'>
): string {
  const vars = buildVariableMap(params);
  return substituteVariables(htmlContent, vars);
}
