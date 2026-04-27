-- Minimal v1 schema based on MVP.md

create type plan_enum as enum ('free', 'paid');
create type job_type_enum as enum ('image', 'video');
create type job_subtype_enum as enum ('t2i', 'i2i', 't2v', 'i2v', 'spider', 'upscale');
create type job_status_enum as enum ('queued', 'running', 'succeeded', 'failed');
create type asset_kind_enum as enum ('image', 'video');
create type ledger_reason_enum as enum ('trial_seed','subscription_grant','job_charge','job_refund','manual_adjust');
create type reservation_status_enum as enum ('pending','finalized','refunded');

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique not null,
  email text,
  plan plan_enum not null default 'free',
  credit_balance int not null default 0,
  trial_ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists credits_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  delta int not null,
  reason ledger_reason_enum not null,
  job_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists credit_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  cost int not null,
  status reservation_status_enum not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  type job_type_enum not null,
  subtype job_subtype_enum not null,
  model text,
  params jsonb,
  status job_status_enum not null,
  cost_credits int not null,
  replicate_prediction_id text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  error text
);

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  job_id uuid references jobs(id) on delete cascade,
  kind asset_kind_enum not null,
  path text not null,
  width int,
  height int,
  size_bytes int,
  is_low_res boolean,
  created_at timestamptz not null default now()
);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  asset_id uuid references assets(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_users_clerk_id on users(clerk_id);
create index if not exists idx_jobs_user_status on jobs(user_id, status);
create index if not exists idx_jobs_prediction on jobs(replicate_prediction_id);
create index if not exists idx_assets_user on assets(user_id);
create index if not exists idx_ledger_user_created on credits_ledger(user_id, created_at);
create index if not exists idx_reservations_user_status on credit_reservations(user_id, status);

-- Trial credits trigger: grant 10 credits on new user insert (free plan)
create or replace function grant_trial_credits()
returns trigger as $$
begin
  if new.plan = 'free' then
    new.credit_balance := coalesce(new.credit_balance, 0) + 10;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_grant_trial_credits on users;
create trigger trg_grant_trial_credits
before insert on users
for each row
execute procedure grant_trial_credits();


