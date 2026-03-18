
-- Add score column to candidates table
ALTER TABLE public.candidates
ADD COLUMN score NUMERIC(3,1) DEFAULT NULL;

-- Description of the change
COMMENT ON COLUMN public.candidates.score IS 'Candidate assessment score (0.0 - 10.0)';
