# Verdora Backend

Cloud data layer for Verdora. The mobile app uses **Supabase** (PostgreSQL + Auth) with Row Level Security.

## Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the full script:
   - [`supabase/schema.sql`](supabase/schema.sql)
3. Copy your project URL and anon key into `frontend/.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

## Tables (all linked by `user_id`)

| Table | Purpose |
|-------|---------|
| `users` | Profiles, location, consent |
| `crops` | Planting / harvest activity |
| `scans` | Crop diagnosis events |
| `weather_logs` | Weather & recommendations |
| `chat_logs` | Farmer questions (optional AI responses) |

## Architecture

See [docs/DATA_ARCHITECTURE.md](docs/DATA_ARCHITECTURE.md) for collection flow, privacy, and analytics goals.

## Future extensions

- Supabase Edge Functions for server-side AI / aggregation
- Scheduled jobs for regional trend reports
- Storage bucket for crop scan images
