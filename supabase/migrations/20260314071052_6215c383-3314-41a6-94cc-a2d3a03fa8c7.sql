
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_company_id uuid;
  company_name text;
  company_slug text;
  company_size text;
  company_industry text;
  company_country text;
  user_role platform_role;
BEGIN
  user_role := COALESCE((NEW.raw_user_meta_data->>'platform_role')::platform_role, 'user');

  -- If company_admin, create the company from metadata
  IF user_role = 'company_admin' AND NEW.raw_user_meta_data->>'company_name' IS NOT NULL THEN
    company_name := NEW.raw_user_meta_data->>'company_name';
    company_slug := lower(regexp_replace(company_name, '[^a-zA-Z0-9]+', '-', 'g'));
    company_slug := trim(BOTH '-' FROM company_slug);
    company_slug := company_slug || '-' || substr(md5(random()::text), 1, 8);
    company_size := NEW.raw_user_meta_data->>'company_size';
    company_industry := NEW.raw_user_meta_data->>'company_industry';
    company_country := NEW.raw_user_meta_data->>'company_country';

    INSERT INTO public.companies (name, slug, size, industry, country, plan)
    VALUES (company_name, company_slug, company_size, company_industry, company_country, 'trial')
    RETURNING id INTO new_company_id;
  END IF;

  INSERT INTO public.profiles (id, full_name, platform_role, company_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    user_role,
    new_company_id
  );

  RETURN NEW;
END;
$function$;
