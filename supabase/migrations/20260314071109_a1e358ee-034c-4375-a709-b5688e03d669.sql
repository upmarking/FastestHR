
-- Fix the overly permissive INSERT policy on companies
-- The trigger now handles company creation, so we can restrict this
DROP POLICY IF EXISTS "Authenticated users can create a company" ON public.companies;

-- Only super admins or the trigger (SECURITY DEFINER) can insert companies
CREATE POLICY "Super admins can insert companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin());
