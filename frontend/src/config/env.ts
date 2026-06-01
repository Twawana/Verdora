/**
 * Centralized environment configuration.
 * Copy .env.example → .env and set values for production APIs.
 */

const PLACEHOLDER_API_URL = 'https://api.verdora.mock';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? PLACEHOLDER_API_URL;

/** True when a real REST backend URL is configured (not the dev placeholder). */
const hasRealApiBackend = !apiUrl.includes('api.verdora.mock');

function resolveUseMockApi(): boolean {
  const flag = process.env.EXPO_PUBLIC_USE_MOCK_API;

  // Explicit opt-in to mocks
  if (flag === 'true') return true;

  // "Live" mode only when a real backend URL is set; otherwise stay on mocks
  if (flag === 'false') return !hasRealApiBackend;

  // Default: mock unless a real API URL was provided
  return !hasRealApiBackend;
}

export const env = {
  /** Base URL for Verdora backend (REST) */
  apiUrl,

  /** When true, all services use local mocks (no network required) */
  useMockApi: resolveUseMockApi(),

  openWeatherApiKey: process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY ?? '',
  geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',

  /** Supabase — used for cloud data sync when configured */
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
} as const;
