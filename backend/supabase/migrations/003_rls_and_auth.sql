-- Verdora 003 — auth trigger, updated_at automation, RLS policies
-- Run after 001_core_tables.sql and 002_intelligence_platform.sql
-- Safe to re-run: drops policies before recreating them.

-- ─── updated_at helper ───
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists trg_fields_updated_at on public.fields;
create trigger trg_fields_updated_at
  before update on public.fields
  for each row execute function public.set_updated_at();

drop trigger if exists trg_crops_updated_at on public.crops;
create trigger trg_crops_updated_at
  before update on public.crops
  for each row execute function public.set_updated_at();

drop trigger if exists trg_disease_alerts_updated_at on public.disease_alerts;
create trigger trg_disease_alerts_updated_at
  before update on public.disease_alerts
  for each row execute function public.set_updated_at();

drop trigger if exists trg_knowledge_gap_updated_at on public.knowledge_gap_reports;
create trigger trg_knowledge_gap_updated_at
  before update on public.knowledge_gap_reports
  for each row execute function public.set_updated_at();

drop trigger if exists trg_planting_insights_updated_at on public.planting_insights;
create trigger trg_planting_insights_updated_at
  before update on public.planting_insights
  for each row execute function public.set_updated_at();

-- ─── Auth helpers ───
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'name', 'Farmer'),
    'farmer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for auth users created before the trigger existed
insert into public.users (id, email, name, role)
select
  au.id,
  coalesce(au.email, ''),
  coalesce(au.raw_user_meta_data->>'name', 'Farmer'),
  'farmer'
from auth.users au
left join public.users pu on pu.id = au.id
where pu.id is null;

-- ─── Enable RLS ───
alter table public.users enable row level security;
alter table public.fields enable row level security;
alter table public.crops enable row level security;
alter table public.scans enable row level security;
alter table public.weather_logs enable row level security;
alter table public.chat_logs enable row level security;
alter table public.disease_alerts enable row level security;
alter table public.knowledge_gap_reports enable row level security;
alter table public.planting_insights enable row level security;
alter table public.aggregation_runs enable row level security;

-- ─── Grants ───
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
grant execute on function public.is_admin() to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;

-- ─── Drop all known policies (legacy + current) ───
drop policy if exists "Allow anon read users" on public.users;
drop policy if exists "Allow anon insert users" on public.users;
drop policy if exists "Allow anon update users" on public.users;
drop policy if exists "Allow anon crops" on public.crops;
drop policy if exists "Allow anon scans" on public.scans;
drop policy if exists "Allow anon weather" on public.weather_logs;
drop policy if exists "Allow anon chat" on public.chat_logs;
drop policy if exists "Allow anon fields" on public.fields;
drop policy if exists "Allow anon crops select" on public.crops;
drop policy if exists "Allow anon crops insert" on public.crops;
drop policy if exists "Allow anon crops update" on public.crops;
drop policy if exists "Allow anon crops delete" on public.crops;
drop policy if exists "Allow anon fields select" on public.fields;
drop policy if exists "Allow anon fields insert" on public.fields;
drop policy if exists "Allow anon fields update" on public.fields;
drop policy if exists "Allow anon fields delete" on public.fields;
drop policy if exists "Allow anon scans select" on public.scans;
drop policy if exists "Allow anon scans insert" on public.scans;
drop policy if exists "Allow anon scans update" on public.scans;
drop policy if exists "Allow anon scans delete" on public.scans;
drop policy if exists "Allow anon weather select" on public.weather_logs;
drop policy if exists "Allow anon weather insert" on public.weather_logs;
drop policy if exists "Allow anon weather update" on public.weather_logs;
drop policy if exists "Allow anon weather delete" on public.weather_logs;
drop policy if exists "Allow anon chat select" on public.chat_logs;
drop policy if exists "Allow anon chat insert" on public.chat_logs;
drop policy if exists "Allow anon chat update" on public.chat_logs;
drop policy if exists "Allow anon chat delete" on public.chat_logs;
drop policy if exists "Allow anon disease_alerts" on public.disease_alerts;
drop policy if exists "Allow anon knowledge_gaps" on public.knowledge_gap_reports;
drop policy if exists "Allow anon planting_insights" on public.planting_insights;
drop policy if exists "Allow anon aggregation_runs" on public.aggregation_runs;

drop policy if exists "Users read own profile or admin reads all" on public.users;
drop policy if exists "Users insert own profile" on public.users;
drop policy if exists "Users update own profile or admin updates all" on public.users;
drop policy if exists "Owner or admin select fields" on public.fields;
drop policy if exists "Owner insert fields" on public.fields;
drop policy if exists "Owner or admin update fields" on public.fields;
drop policy if exists "Owner or admin delete fields" on public.fields;
drop policy if exists "Owner or admin select crops" on public.crops;
drop policy if exists "Owner insert crops" on public.crops;
drop policy if exists "Owner or admin update crops" on public.crops;
drop policy if exists "Owner or admin delete crops" on public.crops;
drop policy if exists "Owner or admin select scans" on public.scans;
drop policy if exists "Owner insert scans" on public.scans;
drop policy if exists "Owner or admin update scans" on public.scans;
drop policy if exists "Owner or admin delete scans" on public.scans;
drop policy if exists "Owner or admin select weather_logs" on public.weather_logs;
drop policy if exists "Owner insert weather_logs" on public.weather_logs;
drop policy if exists "Owner or admin update weather_logs" on public.weather_logs;
drop policy if exists "Owner or admin delete weather_logs" on public.weather_logs;
drop policy if exists "Owner or admin select chat_logs" on public.chat_logs;
drop policy if exists "Owner insert chat_logs" on public.chat_logs;
drop policy if exists "Owner or admin update chat_logs" on public.chat_logs;
drop policy if exists "Owner or admin delete chat_logs" on public.chat_logs;
drop policy if exists "Authenticated read disease_alerts" on public.disease_alerts;
drop policy if exists "Authenticated read knowledge_gap_reports" on public.knowledge_gap_reports;
drop policy if exists "Authenticated read planting_insights" on public.planting_insights;
drop policy if exists "Admin read aggregation_runs" on public.aggregation_runs;

-- ─── users ───
create policy "Users read own profile or admin reads all"
  on public.users for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "Users insert own profile"
  on public.users for insert to authenticated
  with check (id = auth.uid());

create policy "Users update own profile or admin updates all"
  on public.users for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ─── fields ───
create policy "Owner or admin select fields"
  on public.fields for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Owner insert fields"
  on public.fields for insert to authenticated
  with check (user_id = auth.uid());

create policy "Owner or admin update fields"
  on public.fields for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Owner or admin delete fields"
  on public.fields for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ─── crops ───
create policy "Owner or admin select crops"
  on public.crops for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Owner insert crops"
  on public.crops for insert to authenticated
  with check (user_id = auth.uid());

create policy "Owner or admin update crops"
  on public.crops for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Owner or admin delete crops"
  on public.crops for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ─── scans ───
create policy "Owner or admin select scans"
  on public.scans for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Owner insert scans"
  on public.scans for insert to authenticated
  with check (user_id = auth.uid());

create policy "Owner or admin update scans"
  on public.scans for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Owner or admin delete scans"
  on public.scans for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ─── weather_logs ───
create policy "Owner or admin select weather_logs"
  on public.weather_logs for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Owner insert weather_logs"
  on public.weather_logs for insert to authenticated
  with check (user_id = auth.uid());

create policy "Owner or admin update weather_logs"
  on public.weather_logs for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Owner or admin delete weather_logs"
  on public.weather_logs for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ─── chat_logs ───
create policy "Owner or admin select chat_logs"
  on public.chat_logs for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Owner insert chat_logs"
  on public.chat_logs for insert to authenticated
  with check (user_id = auth.uid());

create policy "Owner or admin update chat_logs"
  on public.chat_logs for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Owner or admin delete chat_logs"
  on public.chat_logs for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ─── intelligence (read-only for app clients) ───
create policy "Authenticated read disease_alerts"
  on public.disease_alerts for select to authenticated
  using (true);

create policy "Authenticated read knowledge_gap_reports"
  on public.knowledge_gap_reports for select to authenticated
  using (true);

create policy "Authenticated read planting_insights"
  on public.planting_insights for select to authenticated
  using (true);

create policy "Admin read aggregation_runs"
  on public.aggregation_runs for select to authenticated
  using (public.is_admin());
