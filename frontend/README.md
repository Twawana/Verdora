# Verdora Frontend

Expo SDK 54 React Native app for farmers and admins.

## Structure

```
src/
├── components/    # UI, scanner, calendar, chat, weather, admin, privacy
├── screens/       # auth, farmer, admin screens
├── navigation/    # React Navigation stacks & tabs
├── context/       # Auth, Privacy, Diagnosis state
├── services/
│   ├── api/       # Auth, weather, chat, diagnosis, admin API layer
│   ├── analytics/ # Data collection (local + Supabase sync)
│   ├── supabase/  # Cloud repositories & client
│   ├── data/      # Per-user farmer data helpers
│   └── mocks/     # Mock delays & IDs for demo mode
├── types/         # Shared TypeScript types
├── constants/     # Theme, privacy copy
├── config/        # Environment config
└── data/          # Static crop knowledge & demo users
```

## Commands

```bash
npm install
npm start          # Expo (offline mode)
npm run typecheck
```

## Environment

Copy `.env.example` to `.env` in this folder.
