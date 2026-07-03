CREATE TABLE public.email_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  error TEXT,
  related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  related_request_id UUID REFERENCES public.contact_requests(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.email_log TO service_role;

ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_email_log_created_at ON public.email_log(created_at DESC);
CREATE INDEX idx_email_log_recipient ON public.email_log(recipient);
CREATE INDEX idx_email_log_status ON public.email_log(status);
CREATE INDEX idx_email_log_related_order ON public.email_log(related_order_id);
CREATE INDEX idx_email_log_related_request ON public.email_log(related_request_id);