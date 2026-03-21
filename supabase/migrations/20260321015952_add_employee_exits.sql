CREATE TYPE public.exit_status AS ENUM ('initiated', 'in_progress', 'completed');

CREATE TABLE public.employee_exits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  resignation_date DATE,
  last_working_day DATE,
  reason TEXT,
  status public.exit_status DEFAULT 'initiated',
  exit_interview BOOLEAN DEFAULT false,
  exit_interview_answers JSONB DEFAULT '[]',
  assets_returned BOOLEAN DEFAULT false,
  assets_checklist JSONB DEFAULT '[]',
  settlement_done BOOLEAN DEFAULT false,
  settlement_summary JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id)
);

ALTER TABLE public.employee_exits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view employee exits"
  ON public.employee_exits FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Company admins can manage employee exits"
  ON public.employee_exits FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id() AND public.is_company_admin());
