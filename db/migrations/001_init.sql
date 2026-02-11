create extension if not exists pgcrypto;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_id text unique not null,
  created_time timestamptz not null,
  customer_name text,
  customer_email text,
  items_json jsonb not null default '[]'::jsonb,
  total_amount numeric(12,2) not null,
  currency text not null,
  payment_status text not null,
  fulfillment_status text not null,
  tags_json jsonb not null default '[]'::jsonb,
  payment_confirmed boolean not null default false,
  order_marked_processed boolean not null default false,
  source text not null,
  last_updated timestamptz not null default now()
);

create table if not exists payment_events (
  id uuid primary key default gen_random_uuid(),
  order_ref_id uuid references orders(id),
  email_message_id text,
  confidence numeric(5,2),
  processor text,
  amount numeric(12,2),
  status text not null default 'pending',
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists followups (
  id uuid primary key default gen_random_uuid(),
  order_ref_id uuid references orders(id),
  channel text not null,
  template_key text not null,
  status text not null,
  next_run_at timestamptz not null,
  dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  unique(order_ref_id, template_key, next_run_at)
);

create table if not exists manual_action_queue (
  id uuid primary key default gen_random_uuid(),
  order_ref_id uuid references orders(id),
  reason text not null,
  confidence numeric(5,2),
  status text not null default 'open',
  priority int not null default 50,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists system_heartbeats (
  subsystem text primary key,
  status text not null,
  details jsonb not null default '{}'::jsonb,
  last_seen timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_role text not null,
  actor_id text,
  action text not null,
  target_type text not null,
  target_id text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
