-- ============================================================================
-- VERDORA SUPABASE SCHEMA (UPDATED)
-- Includes complete tables, RLS policies, and automatic auth user profile trigger
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE (connected to Supabase Auth)
-- ============================================================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  role text not null default 'farmer' check (role in ('farmer', 'admin')),
  location text not null,
  farm_size text,
  farmer_type text,
  soil_type text,
  farming_methods text[],
  crops_planted text[] default '{}',
  analytics_consent boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================================================
-- 2. FARMING EVENTS TABLE (Plantation Calendar)
-- ============================================================================
create table if not exists public.farming_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  crop_name text not null,
  field_name text,
  plant_date date not null,
  harvest_date date,
  soil_type text,
  farming_methods text[],
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================================================
-- 3. CROP SCANS TABLE (Disease Diagnosis History)
-- ============================================================================
create table if not exists public.crop_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  crop_type text not null,
  disease text,
  disease_confidence float default 0,
  treatment text,
  image_uri text,
  location text,
  latitude float,
  longitude float,
  scanned_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- ============================================================================
-- 4. CHAT LOGS TABLE (Chatbot Interactions)
-- ============================================================================
create table if not exists public.chat_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  question text not null,
  topic text,
  region text,
  created_at timestamp with time zone default now()
);

-- ============================================================================
-- 5. ENVIRONMENTAL LOGS TABLE (Weather & Conditions)
-- ============================================================================
create table if not exists public.environmental_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  location text not null,
  temperature float,
  humidity float,
  condition text,
  latitude float,
  longitude float,
  recorded_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- ============================================================================
-- 6. DISEASE OUTBREAKS TABLE (Aggregated Disease Data)
-- ============================================================================
create table if not exists public.disease_outbreaks (
  id uuid primary key default gen_random_uuid(),
  disease text not null,
  outbreak_count int default 1,
  locations text[],
  crops_affected text[],
  severity text,
  first_reported timestamp with time zone,
  last_reported timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(disease)
);

-- ============================================================================
-- 7. ADMIN ANALYTICS SUMMARY TABLE (Cached Data for Dashboard)
-- ============================================================================
create table if not exists public.analytics_summary (
  id uuid primary key default gen_random_uuid(),
  metric_type text not null,
  metric_name text not null,
  metric_value int,
  timestamp timestamp with time zone default now(),
  unique(metric_type, metric_name)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
create index if not exists idx_farming_events_user_id on public.farming_events(user_id);
create index if not exists idx_farming_events_plant_date on public.farming_events(plant_date);
create index if not exists idx_crop_scans_user_id on public.crop_scans(user_id);
create index if not exists idx_crop_scans_scanned_at on public.crop_scans(scanned_at);
create index if not exists idx_crop_scans_disease on public.crop_scans(disease);
create index if not exists idx_chat_logs_user_id on public.chat_logs(user_id);
create index if not exists idx_chat_logs_topic on public.chat_logs(topic);
create index if not exists idx_environmental_logs_user_id on public.environmental_logs(user_id);
create index if not exists idx_environmental_logs_location on public.environmental_logs(location);
create index if not exists idx_users_role on public.users(role);
create index if not exists idx_users_location on public.users(location);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.farming_events enable row level security;
alter table public.crop_scans enable row level security;
alter table public.chat_logs enable row level security;
alter table public.environmental_logs enable row level security;
alter table public.disease_outbreaks enable row level security;
alter table public.analytics_summary enable row level security;

-- Users can only see their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
create policy "Users can view their own profile" on public.users
  for select using (auth.uid() = id);

DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;
create policy "Users can create their own profile" on public.users
  for insert with check (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
create policy "Users can update their own profile" on public.users
  for update using (auth.uid() = id);

-- Admins can view all user profiles
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
create policy "Admins can view all users" on public.users
  for select using (
    auth.uid() in (
      select id from public.users where role = 'admin'
    )
  );

-- Users can only see their own farming events
DROP POLICY IF EXISTS "Users can view own farming events" ON public.farming_events;
create policy "Users can view own farming events" on public.farming_events
  for select using (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own farming events" ON public.farming_events;
create policy "Users can create their own farming events" on public.farming_events
  for insert with check (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own farming events" ON public.farming_events;
create policy "Users can update own farming events" on public.farming_events
  for update using (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own farming events" ON public.farming_events;
create policy "Users can delete own farming events" on public.farming_events
  for delete using (auth.uid() = user_id);

-- Users can only see their own crop scans
DROP POLICY IF EXISTS "Users can view own crop scans" ON public.crop_scans;
create policy "Users can view own crop scans" on public.crop_scans
  for select using (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own crop scans" ON public.crop_scans;
create policy "Users can create their own crop scans" on public.crop_scans
  for insert with check (auth.uid() = user_id);

-- Users can only see their own chat logs
DROP POLICY IF EXISTS "Users can view own chat logs" ON public.chat_logs;
create policy "Users can view own chat logs" on public.chat_logs
  for select using (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own chat logs" ON public.chat_logs;
create policy "Users can create their own chat logs" on public.chat_logs
  for insert with check (auth.uid() = user_id);

-- Users can only see their own environmental logs
DROP POLICY IF EXISTS "Users can view own environmental logs" ON public.environmental_logs;
create policy "Users can view own environmental logs" on public.environmental_logs
  for select using (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own environmental logs" ON public.environmental_logs;
create policy "Users can create their own environmental logs" on public.environmental_logs
  for insert with check (auth.uid() = user_id);

-- Everyone can view disease outbreaks (public info)
DROP POLICY IF EXISTS "Everyone can view disease outbreaks" ON public.disease_outbreaks;
create policy "Everyone can view disease outbreaks" on public.disease_outbreaks
  for select using (true);

-- Admins only can update disease outbreaks
DROP POLICY IF EXISTS "Admins can manage disease outbreaks" ON public.disease_outbreaks;
create policy "Admins can manage disease outbreaks" on public.disease_outbreaks
  for all using (
    auth.uid() in (
      select id from public.users where role = 'admin'
    )
  );

-- Everyone can view analytics summary (public dashboards)
DROP POLICY IF EXISTS "Everyone can view analytics summary" ON public.analytics_summary;
create policy "Everyone can view analytics summary" on public.analytics_summary
  for select using (true);

-- Automatically create a user profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger security definer as $$
begin
  insert into public.users (
    id,
    email,
    name,
    role,
    location,
    farm_size,
    farmer_type,
    analytics_consent,
    created_at
  ) values (
    new.id,
    new.email,
    coalesce(new.user_metadata->>'name', 'Farmer'),
    coalesce(new.user_metadata->>'role', 'farmer'),
    coalesce(new.user_metadata->>'location', 'Unknown'),
    new.user_metadata->>'farmSize',
    new.user_metadata->>'farmerType',
    coalesce((new.user_metadata->>'analyticsConsent')::boolean, false),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- SAMPLE DATA (Optional — for testing)
-- ============================================================================

-- Insert sample admin user
-- Note: Use Supabase auth to create actual users, then update them:
-- insert into public.users (id, email, name, role, location)
-- values (gen_random_uuid(), 'admin@verdora.com', 'Admin', 'admin', 'Global')
-- on conflict do nothing;
