ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0, ADD COLUMN IF NOT EXISTS license_limit INTEGER DEFAULT 5, ADD COLUMN IF NOT EXISTS price_per_license NUMERIC DEFAULT 500;

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  description TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can view wallet transactions" ON public.wallet_transactions FOR SELECT TO authenticated USING (company_id = get_user_company_id() OR is_super_admin());

CREATE POLICY "System can insert wallet transactions" ON public.wallet_transactions FOR INSERT TO authenticated WITH CHECK (company_id = get_user_company_id() OR is_super_admin());

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_company ON public.wallet_transactions(company_id, created_at DESC);