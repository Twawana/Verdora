# Migrations

Run these **in order** on a new Supabase project, or use the all-in-one [`../schema.sql`](../schema.sql) instead.

| Order | File | Contents |
|-------|------|----------|
| 1 | `001_core_tables.sql` | Users, fields, crops, scans, weather, chat |
| 2 | `002_intelligence_platform.sql` | PostGIS tables, `disease_alerts_near()` |
| 3 | `003_rls_and_auth.sql` | Triggers, auth signup hook, RLS policies |

## Verdora project

Dashboard: [wfkciaoxqqwleybyvisp](https://supabase.com/dashboard/project/wfkciaoxqqwleybyvisp)

## Repair script

If tables exist but the app gets permission errors, run [`../fix_permissions.sql`](../fix_permissions.sql) (same as step 3, safe to re-run).

## Admin account

After registering in the app, run [`../seed_admin.sql`](../seed_admin.sql) with your email.
