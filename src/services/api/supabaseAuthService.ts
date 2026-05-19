import { supabase } from '../supabaseClient';
import type { User } from '../../types';
import type { LoginResponse } from './types';

const mapDbUserToUser = (row: any): User => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: (row.role as User['role']) || 'farmer',
  location: row.location,
  farmSize: row.farm_size || row.farmSize,
  farmerType: row.farmer_type || row.farmerType,
  soilType: row.soil_type || row.soilType,
  farmingMethods: row.farming_methods || row.farmingMethods,
  analyticsConsent: row.analytics_consent ?? row.analyticsConsent ?? false,
  cropsPlanted: row.crops_planted || row.cropsPlanted || [],
  createdAt: row.created_at || row.createdAt,
});

/**
 * Sign in with Supabase using email and password.
 */
export async function supabaseSignIn(email: string, password: string): Promise<LoginResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  console.log('DATA:', data);
  console.log('ERROR:', error);

  if (error) throw new Error(error.message);

  if (!data.user) throw new Error('Sign in failed: no user returned');

  // Fetch user profile from 'users' table if it exists.
  const { data: profileData, error: profileError } = await supabase
    .from('users')
    .select(
      'id, email, name, role, location, farm_size, farmer_type, soil_type, farming_methods, analytics_consent, crops_planted, created_at',
    )
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError) {
    console.warn('Failed to fetch profile record:', profileError);
  }

  const profile = profileData ? mapDbUserToUser(profileData) : null;
  const user: User = profile || {
    id: data.user.id,
    email: data.user.email || email,
    name: data.user.user_metadata?.name || 'User',
    role: data.user.user_metadata?.role || 'farmer',
    location: data.user.user_metadata?.location || '',
    farmSize: data.user.user_metadata?.farmSize,
    farmerType: data.user.user_metadata?.farmerType,
    analyticsConsent: data.user.user_metadata?.analyticsConsent ?? false,
    cropsPlanted: data.user.user_metadata?.cropsPlanted || [],
    createdAt: data.user.created_at || new Date().toISOString(),
  };

  return {
    user,
    tokens: {
      accessToken: data.session?.access_token || '',
      refreshToken: data.session?.refresh_token || '',
    },
  };
}

/**
 * Sign up with Supabase and create user profile.
 */
export async function supabaseSignUp(
  email: string,
  password: string,
  profile: {
    name?: string;
    location: string;
    farmSize?: string;
    farmerType?: string;
    analyticsConsent?: boolean;
    role?: 'farmer' | 'admin';
  },
): Promise<LoginResponse> {
  // Sign up user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: profile.name,
        location: profile.location,
        farmSize: profile.farmSize,
        farmerType: profile.farmerType,
        analyticsConsent: profile.analyticsConsent,
        role: profile.role || 'farmer',
      },
    },
  });

  if (authError) {
    const authErrorDetails = JSON.stringify({
      message: authError.message,
      status: authError.status,
      details: (authError as any).details,
      hint: (authError as any).hint,
    });
    throw new Error(`Supabase signup failed: ${authErrorDetails}`);
  }
  if (!authData.user) throw new Error('Sign up failed: no user returned');

  // Create user profile record
  const defaultedLocation = profile.location || 'Unknown';
  const newUser: User = {
    id: authData.user.id,
    email: authData.user.email || email,
    name: profile.name || 'Farmer',
    role: profile.role || 'farmer',
    location: defaultedLocation,
    farmSize: profile.farmSize,
    farmerType: profile.farmerType as any,
    analyticsConsent: profile.analyticsConsent ?? false,
    cropsPlanted: [],
    createdAt: authData.user.created_at || new Date().toISOString(),
  };

  const insertData = {
    id: authData.user.id,
    email: authData.user.email || email,
    name: profile.name || 'Farmer',
    role: profile.role || 'farmer',
    location: defaultedLocation,
    farm_size: profile.farmSize,
    farmer_type: profile.farmerType,
    analytics_consent: profile.analyticsConsent ?? false,
  };

  const { error: insertError } = await supabase
    .from('users')
    .upsert(insertData, { onConflict: 'id', ignoreDuplicates: true });

  if (insertError) {
    console.warn('Failed to create or update profile record:', insertError);
    // Don't throw — user can still login
  }

  return {
    user: newUser,
    tokens: {
      accessToken: authData.session?.access_token || '',
      refreshToken: authData.session?.refresh_token || '',
    },
  };
}

/**
 * Sign out the current user.
 */
export async function supabaseSignOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

/**
 * Get the current session.
 */
export async function getSupabaseSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}

/**
 * Refresh access token using refresh token.
 */
export async function refreshSupabaseSession() {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) throw new Error(error.message);
  return data.session;
}
