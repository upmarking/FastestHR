-- Add is_predefined_html column to offer_templates
ALTER TABLE public.offer_templates ADD COLUMN IF NOT EXISTS is_predefined_html BOOLEAN DEFAULT FALSE;

-- Add is_predefined_html column to candidate_offers
ALTER TABLE public.candidate_offers ADD COLUMN IF NOT EXISTS is_predefined_html BOOLEAN DEFAULT FALSE;
