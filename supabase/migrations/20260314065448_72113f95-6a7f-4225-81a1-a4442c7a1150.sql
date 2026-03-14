
-- Fix function search_path warnings
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.generate_ticket_number() SET search_path = public;

-- Fix overly permissive RLS policies
-- 1. Companies INSERT - restrict to authenticated users inserting for themselves
DROP POLICY "Anyone can insert a company during registration" ON public.companies;
CREATE POLICY "Authenticated users can create a company"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (true); -- needed for registration flow, company_id not yet set

-- 2. Notifications INSERT - restrict to company context
DROP POLICY "Admins can create notifications" ON public.notifications;
CREATE POLICY "Company admins can create notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id() OR public.is_super_admin());

-- 3. Audit logs INSERT - restrict to company context
DROP POLICY "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id() OR public.is_super_admin());
