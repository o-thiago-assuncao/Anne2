create table public.donations (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text not null unique,
  stripe_payment_intent_id text,
  amount_cents integer not null,
  currency text not null default 'eur',
  donor_email text,
  donor_name text,
  status text not null default 'pending',
  environment text not null default 'sandbox',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_donations_session on public.donations(stripe_session_id);
create index idx_donations_email on public.donations(donor_email);

alter table public.donations enable row level security;

create policy "Service role manages donations"
  on public.donations for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
