-- 1. Журнал платежей
CREATE TABLE public.payment_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'tinkoff',
  event TEXT NOT NULL,
  amount NUMERIC(12, 2),
  currency TEXT DEFAULT 'RUB',
  status TEXT,
  payment_id TEXT,
  order_key TEXT,
  raw_request JSONB,
  raw_response JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.payment_log TO service_role;

ALTER TABLE public.payment_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_payment_log_created_at ON public.payment_log(created_at DESC);
CREATE INDEX idx_payment_log_order ON public.payment_log(order_id);
CREATE INDEX idx_payment_log_payment_id ON public.payment_log(payment_id);
CREATE INDEX idx_payment_log_status ON public.payment_log(status);

-- 2. Расширяем orders платёжными полями
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT,
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_url TEXT,
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(12, 2) DEFAULT 0;