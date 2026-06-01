-- Fix Supabase "permission denied for table crops/scans" errors
-- Run this in Supabase SQL Editor if cloud sync or export fails

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;

-- Recreate anon policies (safe to re-run)
drop policy if exists "Allow anon crops" on public.crops;
drop policy if exists "Allow anon scans" on public.scans;
drop policy if exists "Allow anon crops select" on public.crops;
drop policy if exists "Allow anon crops insert" on public.crops;
drop policy if exists "Allow anon crops update" on public.crops;
drop policy if exists "Allow anon crops delete" on public.crops;
drop policy if exists "Allow anon scans select" on public.scans;
drop policy if exists "Allow anon scans insert" on public.scans;
drop policy if exists "Allow anon scans update" on public.scans;
drop policy if exists "Allow anon scans delete" on public.scans;

create policy "Allow anon crops select" on public.crops for select to anon, authenticated using (true);
create policy "Allow anon crops insert" on public.crops for insert to anon, authenticated with check (true);
create policy "Allow anon crops update" on public.crops for update to anon, authenticated using (true);
create policy "Allow anon crops delete" on public.crops for delete to anon, authenticated using (true);

create policy "Allow anon scans select" on public.scans for select to anon, authenticated using (true);
create policy "Allow anon scans insert" on public.scans for insert to anon, authenticated with check (true);
create policy "Allow anon scans update" on public.scans for update to anon, authenticated using (true);
create policy "Allow anon scans delete" on public.scans for delete to anon, authenticated using (true);
