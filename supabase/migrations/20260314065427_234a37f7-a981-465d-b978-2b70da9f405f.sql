
-- =============================================
-- FASTESTHR COMPLETE DATABASE SCHEMA
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE public.platform_role AS ENUM ('super_admin', 'company_admin', 'user');
CREATE TYPE public.employment_type AS ENUM ('full_time', 'part_time', 'contract', 'intern');
CREATE TYPE public.employee_status AS ENUM ('active', 'probation', 'on_leave', 'resigned', 'terminated');
CREATE TYPE public.leave_request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE public.payroll_status AS ENUM ('draft', 'processing', 'review', 'finalized', 'paid');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'pending_reply', 'resolved', 'closed');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.candidate_stage AS ENUM ('applied', 'screening', 'interview', 'assessment', 'offer', 'hired', 'rejected');
CREATE TYPE public.job_status AS ENUM ('draft', 'open', 'paused', 'closed');
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired');
CREATE TYPE public.review_status AS ENUM ('draft', 'active', 'completed');
CREATE TYPE public.goal_status AS ENUM ('active', 'completed', 'missed', 'on_track', 'at_risk');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'half_day', 'on_leave', 'holiday', 'weekend');
CREATE TYPE public.survey_status AS ENUM ('draft', 'active', 'closed');
CREATE TYPE public.course_enrollment_status AS ENUM ('enrolled', 'in_progress', 'completed');
CREATE TYPE public.interview_status AS ENUM ('scheduled', 'completed', 'cancelled');

-- =============================================
-- 1. COMPANIES
-- =============================================
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  industry TEXT,
  size TEXT,
  country TEXT,
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  work_days TEXT[] DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri'],
  plan TEXT DEFAULT 'trial',
  plan_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  setup_completed BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. PROFILES
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id),
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  platform_role platform_role DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. ROLES & PERMISSIONS (RBAC)
-- =============================================
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  module TEXT NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_approve BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  view_scope TEXT DEFAULT 'own',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. DEPARTMENTS & DESIGNATIONS
-- =============================================
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  head_id UUID,
  parent_id UUID REFERENCES public.departments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.designations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  level INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. EMPLOYEES
-- =============================================
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  employee_code TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  personal_email TEXT,
  work_email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  nationality TEXT,
  blood_group TEXT,
  address JSONB DEFAULT '{}',
  emergency_contact JSONB DEFAULT '{}',
  department_id UUID REFERENCES public.departments(id),
  designation_id UUID REFERENCES public.designations(id),
  reporting_manager_id UUID REFERENCES public.employees(id),
  employment_type employment_type DEFAULT 'full_time',
  work_location TEXT,
  date_of_joining DATE,
  probation_end_date DATE,
  status employee_status DEFAULT 'active',
  bank_details JSONB DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  avatar_url TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_employees_code ON public.employees(employee_code) WHERE employee_code IS NOT NULL;

-- =============================================
-- 6. INVITATIONS
-- =============================================
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role_id UUID REFERENCES public.roles(id),
  invited_by UUID REFERENCES public.profiles(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status invitation_status DEFAULT 'pending',
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '48 hours'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 7. ATTENDANCE
-- =============================================
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  clock_in_location JSONB,
  clock_in_ip TEXT,
  break_minutes INTEGER DEFAULT 0,
  total_hours NUMERIC(4,2),
  overtime_hours NUMERIC(4,2) DEFAULT 0,
  status attendance_status,
  is_regularized BOOLEAN DEFAULT false,
  regularization_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.employee_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE NOT NULL,
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_shifts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 8. LEAVE
-- =============================================
CREATE TABLE public.leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  max_days_per_year NUMERIC(5,1),
  accrual_type TEXT DEFAULT 'annual',
  carry_forward BOOLEAN DEFAULT false,
  max_carry_forward_days NUMERIC(5,1),
  requires_document BOOLEAN DEFAULT false,
  applicable_gender TEXT DEFAULT 'all',
  color TEXT DEFAULT '#4F46E5',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  leave_type_id UUID REFERENCES public.leave_types(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  total_days NUMERIC(5,1) DEFAULT 0,
  used_days NUMERIC(5,1) DEFAULT 0,
  pending_days NUMERIC(5,1) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  leave_type_id UUID REFERENCES public.leave_types(id) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days NUMERIC(4,1),
  half_day BOOLEAN DEFAULT false,
  half_day_period TEXT,
  reason TEXT,
  document_url TEXT,
  status leave_request_status DEFAULT 'pending',
  approved_by UUID REFERENCES public.employees(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT DEFAULT 'public',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 9. PAYROLL
-- =============================================
CREATE TABLE public.pay_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  min_salary NUMERIC(12,2),
  max_salary NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pay_grades ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.salary_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  effective_from DATE,
  gross_salary NUMERIC(12,2),
  components JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.salary_structures ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status payroll_status DEFAULT 'draft',
  total_gross NUMERIC(14,2) DEFAULT 0,
  total_deductions NUMERIC(14,2) DEFAULT 0,
  total_net NUMERIC(14,2) DEFAULT 0,
  processed_by UUID REFERENCES public.profiles(id),
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID REFERENCES public.payroll_runs(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  gross_salary NUMERIC(12,2),
  total_deductions NUMERIC(12,2),
  net_salary NUMERIC(12,2),
  working_days INTEGER,
  paid_days NUMERIC(5,1),
  lop_days NUMERIC(5,1) DEFAULT 0,
  breakdown JSONB DEFAULT '{}',
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 10. PERFORMANCE
-- =============================================
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'individual',
  start_date DATE,
  due_date DATE,
  progress INTEGER DEFAULT 0,
  status goal_status DEFAULT 'active',
  key_results JSONB DEFAULT '[]',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.review_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'annual',
  period_start DATE,
  period_end DATE,
  review_deadline DATE,
  status review_status DEFAULT 'draft',
  form_template JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.review_cycles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID REFERENCES public.review_cycles(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.employees(id),
  reviewer_type TEXT DEFAULT 'manager',
  status TEXT DEFAULT 'pending',
  responses JSONB DEFAULT '{}',
  overall_rating NUMERIC(3,1),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 11. RECRUITMENT
-- =============================================
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  location TEXT,
  work_type TEXT DEFAULT 'onsite',
  employment_type employment_type DEFAULT 'full_time',
  min_salary NUMERIC(12,2),
  max_salary NUMERIC(12,2),
  description TEXT,
  requirements TEXT,
  status job_status DEFAULT 'draft',
  openings INTEGER DEFAULT 1,
  posted_by UUID REFERENCES public.profiles(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  cover_letter TEXT,
  source TEXT DEFAULT 'careers_page',
  stage candidate_stage DEFAULT 'applied',
  rejection_reason TEXT,
  parsed_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60,
  type TEXT DEFAULT 'video',
  interviewers UUID[] DEFAULT '{}',
  meeting_link TEXT,
  feedback JSONB DEFAULT '[]',
  status interview_status DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 12. LEARNING
-- =============================================
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration_minutes INTEGER,
  type TEXT DEFAULT 'internal',
  content_url TEXT,
  thumbnail_url TEXT,
  skills_covered TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  status course_enrollment_status DEFAULT 'enrolled',
  progress INTEGER DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  certificate_url TEXT,
  assigned_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 13. HELP DESK
-- =============================================
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  ticket_number TEXT UNIQUE,
  raised_by UUID REFERENCES public.employees(id),
  assigned_to UUID REFERENCES public.profiles(id),
  category TEXT DEFAULT 'other',
  subject TEXT NOT NULL,
  description TEXT,
  priority ticket_priority DEFAULT 'medium',
  status ticket_status DEFAULT 'open',
  resolution_note TEXT,
  csat_rating INTEGER,
  sla_due_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 14. ANNOUNCEMENTS
-- =============================================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  target_audience TEXT DEFAULT 'all',
  target_ids UUID[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 15. SURVEYS
-- =============================================
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB DEFAULT '[]',
  is_anonymous BOOLEAN DEFAULT false,
  target_audience TEXT DEFAULT 'all',
  deadline TIMESTAMPTZ,
  status survey_status DEFAULT 'draft',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
  respondent_id UUID REFERENCES public.employees(id),
  answers JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 16. NOTIFICATIONS
-- =============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 17. AUDIT LOGS
-- =============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  actor_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  before_state JSONB,
  after_state JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTIONS (for RLS)
-- =============================================

-- Get the company_id for the current user
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Get the platform_role for the current user
CREATE OR REPLACE FUNCTION public.get_user_platform_role()
RETURNS platform_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT platform_role FROM public.profiles WHERE id = auth.uid()
$$;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND platform_role = 'super_admin'
  )
$$;

-- Check if user is company admin
CREATE OR REPLACE FUNCTION public.is_company_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND platform_role = 'company_admin'
  )
$$;

-- Get employee_id for the current user
CREATE OR REPLACE FUNCTION public.get_user_employee_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.employees WHERE user_id = auth.uid() AND deleted_at IS NULL LIMIT 1
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- COMPANIES
CREATE POLICY "Super admins can do everything with companies"
  ON public.companies FOR ALL TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Users can view their own company"
  ON public.companies FOR SELECT TO authenticated
  USING (id = public.get_user_company_id());

CREATE POLICY "Company admins can update their company"
  ON public.companies FOR UPDATE TO authenticated
  USING (id = public.get_user_company_id() AND public.is_company_admin());

CREATE POLICY "Anyone can insert a company during registration"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (true);

-- PROFILES
CREATE POLICY "Super admins can do everything with profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Users can view profiles in their company"
  ON public.profiles FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- ROLES
CREATE POLICY "Company members can view roles"
  ON public.roles FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Company admins can manage roles"
  ON public.roles FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- ROLE_PERMISSIONS
CREATE POLICY "Company members can view role permissions"
  ON public.role_permissions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.roles r WHERE r.id = role_id AND r.company_id = public.get_user_company_id()
  ) OR public.is_super_admin());

CREATE POLICY "Company admins can manage role permissions"
  ON public.role_permissions FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.roles r WHERE r.id = role_id AND r.company_id = public.get_user_company_id()
  ) AND public.is_company_admin());

-- USER_ROLES
CREATE POLICY "Company members can view user roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.company_id = public.get_user_company_id()
  ) OR public.is_super_admin());

CREATE POLICY "Company admins can manage user roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.company_id = public.get_user_company_id()
  ) AND public.is_company_admin());

-- Helper macro for company-scoped tables
-- DEPARTMENTS
CREATE POLICY "Company members can view departments"
  ON public.departments FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Company admins can manage departments"
  ON public.departments FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- DESIGNATIONS
CREATE POLICY "Company members can view designations"
  ON public.designations FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Company admins can manage designations"
  ON public.designations FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- EMPLOYEES
CREATE POLICY "Company members can view employees"
  ON public.employees FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Company admins can manage employees"
  ON public.employees FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND (public.is_company_admin() OR public.is_super_admin()));

CREATE POLICY "Employees can update their own record"
  ON public.employees FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- INVITATIONS
CREATE POLICY "Company members can view invitations"
  ON public.invitations FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Company admins can manage invitations"
  ON public.invitations FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- ATTENDANCE
CREATE POLICY "Company members can view attendance"
  ON public.attendance FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Employees can insert own attendance"
  ON public.attendance FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Company admins can manage attendance"
  ON public.attendance FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- SHIFTS
CREATE POLICY "Company members can view shifts"
  ON public.shifts FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Company admins can manage shifts"
  ON public.shifts FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- EMPLOYEE_SHIFTS
CREATE POLICY "Company members can view employee shifts"
  ON public.employee_shifts FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.company_id = public.get_user_company_id()
  ) OR public.is_super_admin());

CREATE POLICY "Company admins can manage employee shifts"
  ON public.employee_shifts FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.company_id = public.get_user_company_id()
  ) AND public.is_company_admin());

-- LEAVE_TYPES
CREATE POLICY "Company members can view leave types"
  ON public.leave_types FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Company admins can manage leave types"
  ON public.leave_types FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- LEAVE_BALANCES
CREATE POLICY "Employees can view own leave balances"
  ON public.leave_balances FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.employees e WHERE e.id = employee_id AND (e.user_id = auth.uid() OR e.company_id = public.get_user_company_id())
  ) OR public.is_super_admin());

CREATE POLICY "Company admins can manage leave balances"
  ON public.leave_balances FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.company_id = public.get_user_company_id()
  ) AND public.is_company_admin());

-- LEAVE_REQUESTS
CREATE POLICY "Company members can view leave requests"
  ON public.leave_requests FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Employees can create leave requests"
  ON public.leave_requests FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Company admins can manage leave requests"
  ON public.leave_requests FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_company_admin());

CREATE POLICY "Employees can update own leave requests"
  ON public.leave_requests FOR UPDATE TO authenticated
  USING (employee_id = public.get_user_employee_id());

-- HOLIDAYS
CREATE POLICY "Company members can view holidays"
  ON public.holidays FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Company admins can manage holidays"
  ON public.holidays FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- PAY_GRADES
CREATE POLICY "Company members can view pay grades"
  ON public.pay_grades FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Company admins can manage pay grades"
  ON public.pay_grades FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- SALARY_STRUCTURES
CREATE POLICY "Company admins can manage salary structures"
  ON public.salary_structures FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND (public.is_company_admin() OR public.is_super_admin()));

CREATE POLICY "Employees can view own salary"
  ON public.salary_structures FOR SELECT TO authenticated
  USING (employee_id = public.get_user_employee_id());

-- PAYROLL_RUNS
CREATE POLICY "Company admins can manage payroll runs"
  ON public.payroll_runs FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND (public.is_company_admin() OR public.is_super_admin()));

-- PAYSLIPS
CREATE POLICY "Company admins can manage payslips"
  ON public.payslips FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND (public.is_company_admin() OR public.is_super_admin()));

CREATE POLICY "Employees can view own payslips"
  ON public.payslips FOR SELECT TO authenticated
  USING (employee_id = public.get_user_employee_id());

-- GOALS
CREATE POLICY "Company members can view goals"
  ON public.goals FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Company members can manage own goals"
  ON public.goals FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id());

-- REVIEW_CYCLES
CREATE POLICY "Company members can view review cycles"
  ON public.review_cycles FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Company admins can manage review cycles"
  ON public.review_cycles FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- PERFORMANCE_REVIEWS
CREATE POLICY "Company members can view performance reviews"
  ON public.performance_reviews FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.employees e WHERE (e.id = reviewee_id OR e.id = reviewer_id) AND e.company_id = public.get_user_company_id()
  ) OR public.is_super_admin());

CREATE POLICY "Company admins can manage performance reviews"
  ON public.performance_reviews FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.employees e WHERE e.id = reviewee_id AND e.company_id = public.get_user_company_id()
  ) AND public.is_company_admin());

-- JOBS
CREATE POLICY "Company members can view jobs"
  ON public.jobs FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Company admins can manage jobs"
  ON public.jobs FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- CANDIDATES
CREATE POLICY "Company members can view candidates"
  ON public.candidates FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Company admins can manage candidates"
  ON public.candidates FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- INTERVIEWS
CREATE POLICY "Company members can view interviews"
  ON public.interviews FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.candidates c WHERE c.id = candidate_id AND c.company_id = public.get_user_company_id()
  ) OR public.is_super_admin());

CREATE POLICY "Company admins can manage interviews"
  ON public.interviews FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.candidates c WHERE c.id = candidate_id AND c.company_id = public.get_user_company_id()
  ) AND public.is_company_admin());

-- COURSES
CREATE POLICY "Company members can view courses"
  ON public.courses FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Company admins can manage courses"
  ON public.courses FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- COURSE_ENROLLMENTS
CREATE POLICY "Company members can view course enrollments"
  ON public.course_enrollments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.company_id = public.get_user_company_id()
  ) OR public.is_super_admin());

CREATE POLICY "Company admins can manage course enrollments"
  ON public.course_enrollments FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.company_id = public.get_user_company_id()
  ) AND public.is_company_admin());

-- TICKETS
CREATE POLICY "Company members can view tickets"
  ON public.tickets FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Employees can create tickets"
  ON public.tickets FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Company admins can manage tickets"
  ON public.tickets FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- TICKET_COMMENTS
CREATE POLICY "Company members can view ticket comments"
  ON public.ticket_comments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.company_id = public.get_user_company_id()
  ) OR public.is_super_admin());

CREATE POLICY "Authenticated users can create ticket comments"
  ON public.ticket_comments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.company_id = public.get_user_company_id()
  ));

-- ANNOUNCEMENTS
CREATE POLICY "Company members can view announcements"
  ON public.announcements FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Company admins can manage announcements"
  ON public.announcements FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- ANNOUNCEMENT_READS
CREATE POLICY "Company members can manage announcement reads"
  ON public.announcement_reads FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.announcements a WHERE a.id = announcement_id AND a.company_id = public.get_user_company_id()
  ) OR public.is_super_admin());

-- SURVEYS
CREATE POLICY "Company members can view surveys"
  ON public.surveys FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() OR public.is_super_admin());

CREATE POLICY "Company admins can manage surveys"
  ON public.surveys FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_company_admin());

-- SURVEY_RESPONSES
CREATE POLICY "Company members can manage survey responses"
  ON public.survey_responses FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.surveys s WHERE s.id = survey_id AND s.company_id = public.get_user_company_id()
  ) OR public.is_super_admin());

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can create notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- AUDIT_LOGS
CREATE POLICY "Super admins can view all audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Company admins can view company audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_company_admin());

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- =============================================
-- TRIGGERS: auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'companies', 'profiles', 'roles', 'role_permissions',
      'departments', 'designations', 'employees',
      'attendance', 'shifts',
      'leave_types', 'leave_balances', 'leave_requests',
      'pay_grades', 'salary_structures', 'payroll_runs', 'payslips',
      'goals', 'review_cycles', 'performance_reviews',
      'jobs', 'candidates', 'interviews',
      'courses', 'course_enrollments',
      'tickets', 'announcements', 'surveys'
    ])
  LOOP
    EXECUTE format('
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.%I
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
    ', t);
  END LOOP;
END;
$$;

-- =============================================
-- TRIGGER: Auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, platform_role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'platform_role')::platform_role, 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TRIGGER: Auto-generate ticket number
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.tickets
  WHERE company_id = NEW.company_id;
  
  NEW.ticket_number := 'TKT-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  WHEN (NEW.ticket_number IS NULL)
  EXECUTE FUNCTION public.generate_ticket_number();

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX idx_profiles_company ON public.profiles(company_id);
CREATE INDEX idx_employees_company ON public.employees(company_id);
CREATE INDEX idx_employees_user ON public.employees(user_id);
CREATE INDEX idx_employees_department ON public.employees(department_id);
CREATE INDEX idx_attendance_employee_date ON public.attendance(employee_id, date);
CREATE INDEX idx_attendance_company_date ON public.attendance(company_id, date);
CREATE INDEX idx_leave_requests_employee ON public.leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_company ON public.audit_logs(company_id, created_at);
CREATE INDEX idx_tickets_company ON public.tickets(company_id, status);
CREATE INDEX idx_candidates_job ON public.candidates(job_id, stage);
