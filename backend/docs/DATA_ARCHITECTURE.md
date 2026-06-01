# Verdora Data Collection Architecture

## Overview

Verdora is designed as an **agricultural intelligence & data collection platform**. All farmer interactions are structured, stored, and queryable for analytics.

## Storage Layers

| Layer | Purpose |
|-------|---------|
| **Supabase (cloud)** | Primary scalable store — tables linked by `user_id` |
| **AsyncStorage (local)** | Offline cache + fallback when Supabase is not configured |

## Database Schema (`backend/supabase/schema.sql`)

| Table | Purpose | Key fields |
|-------|---------|------------|
| `users` | Profile & consent | `user_id`, `location`, `crop_preferences`, `data_consent` |
| `crops` | Farming activity | `plant_date`, `harvest_date`, `crop_name` |
| `scans` | AI crop diagnosis | `image_url`, `disease`, `confidence`, `location` |
| `weather_logs` | Environmental data | `temperature`, `recommendation_shown` |
| `chat_logs` | Chatbot interactions | `question`, `ai_response` |

## Data Flow

```
Farmer action → Privacy check (consent) → Local analytics DB → Supabase insert
Admin dashboard → Supabase aggregate query → Regional insights UI
```

## Privacy (mandatory)

- Consent notice at signup (required to register)
- Opt-out anytime in **Hub → Privacy & data collection**
- No sale of personal data
- Aggregated insights only for reports

## Setup Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Run `backend/supabase/schema.sql` in SQL Editor
3. Add to `frontend/.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

## Future Analytics Enabled

- Regional crop trends
- Disease outbreak detection
- Optimal planting periods
- Farmer behavior & knowledge-gap analysis (from chat_logs)
