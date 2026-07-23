alter table public.portfolio_cases
  alter column slug set default ('case-' || gen_random_uuid()::text);
