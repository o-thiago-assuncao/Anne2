ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS original_amount_cents integer,
  ADD COLUMN IF NOT EXISTS attempt_number integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS previous_session_id text,
  ADD COLUMN IF NOT EXISTS failure_reason text;

CREATE INDEX IF NOT EXISTS idx_donations_previous_session
  ON public.donations(previous_session_id);

CREATE INDEX IF NOT EXISTS idx_donations_session_id
  ON public.donations(stripe_session_id);