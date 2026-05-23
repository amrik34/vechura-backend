create table if not exists public.landing_pages (
  id uuid not null default gen_random_uuid(),
  slug text primary key,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint landing_pages_id_key unique (id)
);

create index if not exists landing_pages_updated_at_idx
  on public.landing_pages (updated_at desc);
