import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

const supabaseUrl = env.supabaseUrl;
const supabaseAnonKey = env.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
