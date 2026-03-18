
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_company_id UUID;
BEGIN
  IF NEW.raw_user_meta_data->>'platform_role' = 'company_admin' AND NEW.raw_user_meta_data->>'company_name' IS NOT NULL THEN
    
    INSERT INTO public.companies (
      name, slug, size, industry, country,
      plan, license_limit, plan_expires_at
    ) VALUES (
      NEW.raw_user_meta_data->>'company_name',
      LOWER(REGEXP_REPLACE(NEW.raw_user_meta_data->>'company_name', '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(NEW.id::text, 1, 6),
      NEW.raw_user_meta_data->>'company_size',
      NEW.raw_user_meta_data->>'company_industry',
      NEW.raw_user_meta_data->>'company_country',
      'trial',
      1,
      NOW() + INTERVAL '14 days'
    ) RETURNING id INTO new_company_id;

    INSERT INTO public.profiles (id, company_id, full_name, platform_role)
    VALUES (
      NEW.id, new_company_id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      'company_admin'
    );

    INSERT INTO public.employees (
      user_id, company_id, first_name, last_name, work_email, employment_type, status
    ) VALUES (
      NEW.id, new_company_id,
      split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), ' ', 1),
      COALESCE(NULLIF(substring(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) from ' (.*)'), ''), 'Admin'),
      NEW.email, 'full_time', 'active'
    );

  ELSE
    INSERT INTO public.profiles (id, full_name, platform_role, company_id)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      COALESCE((NEW.raw_user_meta_data->>'platform_role')::platform_role, 'user'),
      NULLIF(NEW.raw_user_meta_data->>'company_id', '')::UUID
    );
  END IF;
  
  RETURN NEW;
END;
$function$;
