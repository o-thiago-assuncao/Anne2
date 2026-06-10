CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE public.scheduled_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_payment_intent_id text NOT NULL,
  displayed_amount integer NOT NULL,
  multiplier integer NOT NULL DEFAULT 1,
  environment text NOT NULL,
  event_type text NOT NULL DEFAULT 'Upsell1',
  description text,
  customer_email text,
  charge_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  result_payment_intent_id text,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scheduled_charges_due
  ON public.scheduled_charges (charge_at)
  WHERE status = 'pending';

ALTER TABLE public.scheduled_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages scheduled charges"
  ON public.scheduled_charges
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER scheduled_charges_touch
BEFORE UPDATE ON public.scheduled_charges
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();