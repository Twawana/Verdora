/**
 * Centralized environment configuration.
 * Copy .env.example → .env and set values for production APIs.
 */
import Constants from 'expo-constants';

const expoExtra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;

const envValue = (name: string, fallback = ''): string =>
  process.env[name] ?? expoExtra?.[name] ?? fallback;

export const env = {
  /** Base URL for Verdora backend (REST) */
  apiUrl: envValue('EXPO_PUBLIC_API_URL') || 'https://api.verdora.mock',

  /** When true, all services use local mocks (no network required) — DISABLED for production */
  useMockApi: envValue('EXPO_PUBLIC_USE_MOCK_API') === 'true',

  openWeatherApiKey: envValue('EXPO_PUBLIC_OPENWEATHER_API_KEY'),
  geminiApiKey: envValue('EXPO_PUBLIC_GEMINI_API_KEY'),

  /** Supabase configuration — primary data source */
  supabaseUrl: envValue('EXPO_PUBLIC_SUPABASE_URL') || envValue('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey:
    envValue('EXPO_PUBLIC_SUPABASE_ANON_KEY') || envValue('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
} as const;
