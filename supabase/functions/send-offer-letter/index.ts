import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as nodemailer from "https://esm.sh/nodemailer@6.9.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      candidate_id, 
      job_id, 
      company_id, 
      offer_data,
      html_content,
      pdf_path,
      offer_number,
      template_id
    } = await req.json();

    if (!candidate_id || !job_id || !company_id || !pdf_path || !html_content) {
      throw new Error('Missing required fields');
    }

    // 1. Fetch company settings
    const { data: company, error: companyError } = await supabaseClient
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      throw new Error(`Company not found: ${companyError?.message}`);
    }

    // 2. Fetch candidate & job for email
    const { data: candidate, error: candidateError } = await supabaseClient
      .from('candidates')
      .select('full_name, email')
      .eq('id', candidate_id)
      .single();

    if (candidateError || !candidate) {
      throw new Error('Candidate not found');
    }

    const { data: job, error: jobError } = await supabaseClient
      .from('jobs')
      .select('title')
      .eq('id', job_id)
      .single();
    
    if (jobError || !job) {
      throw new Error('Job not found');
    }

    // 3. Save to candidate_offers
    const { data: savedOffer, error: saveError } = await supabaseClient
      .from('candidate_offers')
      .insert({
        company_id,
        candidate_id,
        job_id,
        template_id: template_id || null,
        offer_number: offer_number,
        joining_date: offer_data?.joiningDate,
        payout: offer_data?.payout,
        html_content: html_content,
        pdf_url: pdf_path
      })
      .select()
      .single();

    if (saveError) {
      throw new Error(`Failed to save offer: ${saveError.message}`);
    }

    // 4. Download PDF from Storage to attach
    console.log(`Downloading PDF from offer_letters bucket: ${pdf_path}`);
    const { data: pdfBlob, error: downloadError } = await supabaseClient
      .storage
      .from('offer_letters')
      .download(pdf_path);

    if (downloadError || !pdfBlob) {
      throw new Error(`Failed to download PDF attachment: ${downloadError?.message}`);
    }
    const pdfBuffer = await pdfBlob.arrayBuffer();

    // 4.5 Fetch template for email subject/body
    let templateEmailSubject: string | null = null;
    let templateEmailBody: string | null = null;
    if (template_id) {
      const { data: tmpl } = await supabaseClient
        .from('offer_templates')
        .select('email_subject, email_body')
        .eq('id', template_id)
        .single();
      if (tmpl) {
        templateEmailSubject = tmpl.email_subject;
        templateEmailBody = tmpl.email_body;
      }
    }

    // 5. Format Email
    const publicUrl = `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/offer/${savedOffer.token}`;
    
    // Replace variables in template subject/body
    const replaceVars = (text: string) => {
      return text
        .replace(/\{\{candidate_name\}\}/g, candidate.full_name)
        .replace(/\{\{first_name\}\}/g, candidate.full_name.split(' ')[0])
        .replace(/\{\{job_title\}\}/g, job.title)
        .replace(/\{\{offer_number\}\}/g, offer_number || '')
        .replace(/\{\{offer_link\}\}/g, publicUrl);
    };

    const emailSubject = templateEmailSubject 
      ? replaceVars(templateEmailSubject)
      : `Offer of Employment - ${job.title}`;

    let emailHtml: string;
    if (templateEmailBody) {
      // Convert plain text body to HTML (preserve newlines)
      const bodyHtml = replaceVars(templateEmailBody)
        .split('\n')
        .map((line: string) => line.trim() === '' ? '<br/>' : `<p style="margin:0 0 8px 0">${line}</p>`)
        .join('\n');
      emailHtml = `<div style="font-family: sans-serif; line-height: 1.6;">${bodyHtml}</div>`;
    } else {
      emailHtml = `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2>Congratulations ${candidate.full_name.split(' ')[0]}!</h2>
          <p>We are excited to offer you the position of <strong>${job.title}</strong> at ${company.name}.</p>
          <p>Please find your official offer letter attached to this email as a PDF document.</p>
          <p>You can also view and accept your offer online by clicking the button below:</p>
          <div style="margin: 2rem 0;">
            <a href="${publicUrl}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">View Offer Online</a>
          </div>
          <p>If you have any questions, feel free to reply to this email.</p>
          <p>Best regards,<br/>The Hiring Team</p>
        </div>
      `;
    }

    // 6. Send Email using nodemailer
    const transporter = nodemailer.createTransport({
      host: company.smtp_host,
      port: parseInt(company.smtp_port),
      secure: parseInt(company.smtp_port) === 465,
      auth: {
        user: company.smtp_user,
        pass: company.smtp_pass,
      },
    });

    await transporter.sendMail({
      from: `"${company.smtp_from_name || 'HR'}" <${company.smtp_from_email || company.smtp_user}>`,
      to: candidate.email,
      subject: emailSubject,
      html: emailHtml,
      attachments: [
        {
          filename: `Offer-${candidate.full_name.replace(/\\s+/g, '-')}.pdf`,
          content: new Uint8Array(pdfBuffer),
          contentType: 'application/pdf'
        }
      ]
    });


    return new Response(JSON.stringify({ success: true, offer_id: savedOffer.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: unknown) {
    console.error('Offer Letter Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
