# Verdora Backend

Cloud data layer for Verdora. The mobile app uses **Supabase** (PostgreSQL + Auth) with Row Level Security tied to `auth.uid()`.

**All SQL files live in [`../supabase/`](../supabase/)** at the repo root (standard Supabase layout).

## New Supabase project

Follow **[../supabase/SETUP.md](../supabase/SETUP.md)** — create a project, run one SQL file, connect the app.

Quick version:

1. Create a project at [supabase.com](https://supabase.com)
2. Enable **Email** auth
3. Run [`../supabase/schema.sql`](../supabase/schema.sql) in the SQL Editor  
   — or run migrations `001` → `002` → `003` in order (see [../supabase/migrations/README.md](../supabase/migrations/README.md))
4. Copy URL + anon key into `frontend/.env`

## Tables

| Table | Purpose |
|-------|---------|
| `users` | Profiles linked to Supabase Auth (`auth.users`) |
| `fields` | Multi-plot farm locations |
| `crops` | Planting / harvest activity |
| `scans` | Crop diagnosis events |
| `weather_logs` | Weather and recommendations |
| `chat_logs` | Farmer questions (optional AI responses) |
| `disease_alerts` | Geospatial disease outbreak clusters |
| `knowledge_gap_reports` | Chat topic gaps by region |
| `planting_insights` | Planting window optimization |
| `aggregation_runs` | Nightly job audit log |

Farmer data is scoped by `user_id`. Admins (`role = 'admin'`) can read all farmer tables for the dashboard.

## Architecture

See [docs/DATA_ARCHITECTURE.md](docs/DATA_ARCHITECTURE.md) for collection flow, privacy, and analytics.

## Edge Functions

- `nightly-aggregation` — clusters disease scans, knowledge gaps, planting insights (cron: `0 2 * * *`)

Deploy: [../supabase/functions/README.md](../supabase/functions/README.md)

## Utility SQL

| File | Purpose |
|------|---------|
| [`../supabase/fix_permissions.sql`](../supabase/fix_permissions.sql) | Re-apply grants + RLS (safe to re-run) |
| [`../supabase/seed_admin.sql`](../supabase/seed_admin.sql) | Promote a user to admin by email |
