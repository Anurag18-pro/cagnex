create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists organization_members (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('super_admin', 'managing_director', 'lead_underwriter', 'credit_analyst', 'external_auditor')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  borrower_name text not null default '',
  facility_type text not null default 'Term Loan B',
  facility_amount numeric(18,2),
  status text not null default 'queued' check (status in ('queued', 'classifying', 'parsing', 'review', 'complete', 'error')),
  assigned_to uuid references users(id),
  created_by uuid not null references users(id),
  flags_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists deal_documents (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  filename text not null,
  storage_key text not null,
  document_type text,
  version_label text,
  page_count integer,
  processing_status text not null default 'queued' check (processing_status in ('queued', 'classifying', 'ocr', 'extracting', 'validating', 'complete', 'error')),
  progress_pct integer not null default 0 check (progress_pct between 0 and 100),
  sha256 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists source_references (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references deal_documents(id) on delete cascade,
  page integer not null check (page > 0),
  section_label text,
  bbox jsonb not null,
  extraction_method text not null check (extraction_method in ('native_text', 'ocr', 'table_parser')),
  confidence numeric(5,4) not null check (confidence between 0 and 1),
  text_snippet text,
  created_at timestamptz not null default now()
);

create table if not exists financial_line_items (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  gaap_tag text not null,
  line_label_raw text not null,
  period text not null,
  reported_value numeric(18,4) not null,
  audited_value numeric(18,4),
  variance_pct numeric(9,4),
  source_reference_id uuid references source_references(id),
  computed_by text not null check (computed_by in ('llm_extracted', 'sandbox_derived')),
  reviewer_status text not null default 'pending' check (reviewer_status in ('pending', 'approved', 'overridden', 'flagged')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists covenants (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  category text not null check (category in ('financial', 'negative', 'operational')),
  covenant_type text not null,
  operator text not null check (operator in ('<=', '<', '>=', '>', '==')),
  threshold_value numeric(18,4) not null,
  unit text not null,
  actual_value numeric(18,4),
  headroom_pct numeric(9,4),
  test_frequency text not null default 'quarterly',
  clause_text text,
  source_reference_id uuid references source_references(id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'overridden', 'flagged')),
  override_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  deal_id uuid references deals(id) on delete cascade,
  type text not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'complete', 'failed')),
  progress_pct integer not null default 0,
  result_ref text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_id uuid references users(id),
  action text not null,
  resource_type text not null,
  resource_id uuid,
  before_state jsonb,
  after_state jsonb,
  event_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '',
  trigger text not null,
  active boolean not null default true,
  runs integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workflows_user_id_updated_at_idx
  on workflows(user_id, updated_at desc);
create index if not exists deals_organization_id_updated_at_idx
  on deals(organization_id, updated_at desc);
create index if not exists deal_documents_deal_id_idx
  on deal_documents(deal_id, updated_at desc);
create index if not exists audit_events_organization_id_created_at_idx
  on audit_events(organization_id, created_at desc);
