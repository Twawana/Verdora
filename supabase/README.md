# Verdora Supabase SQL

All database scripts for project **https://wfkciaoxqqwleybyvisp.supabase.co**

Setup guide: [SETUP.md](SETUP.md)

## Files (start here)

| File | What it does |
|------|----------------|
| **[schema.sql](schema.sql)** | Full install — run this once in Supabase SQL Editor |
| [migrations/001_core_tables.sql](migrations/001_core_tables.sql) | Step 1 — users, fields, crops, scans, weather, chat |
| [migrations/002_intelligence_platform.sql](migrations/002_intelligence_platform.sql) | Step 2 — PostGIS tables + `disease_alerts_near()` |
| [migrations/003_rls_and_auth.sql](migrations/003_rls_and_auth.sql) | Step 3 — triggers, signup hook, RLS |
| [fix_permissions.sql](fix_permissions.sql) | Repair — re-apply grants + RLS (safe to re-run) |
| [seed_admin.sql](seed_admin.sql) | Promote your account to admin after signup |

## Folder layout

```
supabase/
├── README.md              ← you are here
├── SETUP.md               ← step-by-step new project guide
├── schema.sql             ← all-in-one install
├── fix_permissions.sql
├── seed_admin.sql
├── migrations/
│   ├── 001_core_tables.sql
│   ├── 002_intelligence_platform.sql
│   └── 003_rls_and_auth.sql
└── functions/
    └── nightly-aggregation/
```

## Quick start

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/wfkciaoxqqwleybyvisp/sql)
2. Paste and run **schema.sql**
3. Add URL + anon key to `frontend/.env`
