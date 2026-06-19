# New Supabase Project Setup

Use this guide when provisioning a **fresh** Supabase database for Verdora.

## 1. Create the project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. Choose a region close to your farmers and wait for the database to finish provisioning.

## 2. Enable authentication

1. Open **Authentication → Providers**.
2. Enable **Email** (required for farmer registration).
3. Under **Authentication → Settings**, disable **Confirm email** if you want instant signup during development (optional).

## 3. Run the schema

1. Open **SQL Editor → New query**.
2. Paste the full contents of [`schema.sql`](schema.sql).
3. Click **Run**.

This single script creates all tables, PostGIS functions, auth triggers, and Row Level Security policies. You do **not** need the older `migrations/002_*` or `003_*` files on a new project.

### What gets created

| Table | Purpose |
|-------|---------|
| `users` | Farmer/admin profiles (linked to `auth.users`) |
| `fields` | Multi-plot farm locations |
| `crops` | Planting and harvest records |
| `scans` | Crop diagnosis events |
| `weather_logs` | Weather snapshots and recommendations |
| `chat_logs` | AI assistant questions |
| `disease_alerts` | Regional outbreak clusters (PostGIS) |
| `knowledge_gap_reports` | Chat topic gaps by region |
| `planting_insights` | Planting window analytics |
| `aggregation_runs` | Nightly job audit log |

## 4. Connect the mobile app

1. Copy **Project URL** and **anon public key** from **Settings → API**.
2. In the repo:

   ```bash
   cd frontend
   cp .env.example .env
   ```

3. Set in `frontend/.env`:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. Install and start:

   ```bash
   npm install
   npm start
   ```

## 5. Create an admin account (optional)

1. Register a farmer account in the app (or via **Authentication → Users** in Supabase).
2. In SQL Editor, promote that user:

   ```sql
   update public.users
   set role = 'admin'
   where email = 'you@example.com';
   ```

3. Log out and back in — the app routes admin users to the admin dashboard.

## 6. Deploy nightly aggregation (optional)

See [`functions/README.md`](functions/README.md) to deploy the `nightly-aggregation` Edge Function and schedule it (`0 2 * * *`).

The function uses the **service role** key and bypasses RLS to write `disease_alerts`, `knowledge_gap_reports`, and `planting_insights`.

## Troubleshooting

| Error | Fix |
|-------|-----|
| `permission denied for table crops` | Re-run the RLS/grant section at the bottom of `schema.sql`, or run [`fix_permissions.sql`](fix_permissions.sql) **only on legacy databases** — new installs should not need it. |
| `relation "fields" does not exist` | You ran an old partial schema. Drop the `public` tables and re-run `schema.sql` on a fresh project. |
| Signup works but profile missing | Check the `on_auth_user_created` trigger exists; the app also upserts via `usersRepository`. |
| Admin dashboard empty | Log in as a user with `role = 'admin'`; farmers only see their own rows. |

## Migrating from an old Verdora database

If you have data in a previous Supabase project with `text` user IDs and open RLS policies, treat this as a **new** database rather than an in-place migration. Export what you need, create a new project, run `schema.sql`, and reconnect the app.
