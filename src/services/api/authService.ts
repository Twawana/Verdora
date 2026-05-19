import { env } from '../../config/env';
import type { User } from '../../types';
import { API_ENDPOINTS } from './endpoints';
import { apiPost, apiClient } from './client';
import { tokenStorage } from './tokenStorage';
import type { LoginRequest, LoginResponse, RegisterRequest } from './types';
import {
  supabaseSignIn,
  supabaseSignUp,
  supabaseSignOut,
  getSupabaseSession,
} from './supabaseAuthService';

// ——— Public API ———

/**
 * Authenticate user with Supabase.
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await supabaseSignIn(credentials.email, credentials.password);
    await tokenStorage.setTokens(response.tokens);
    return response;
  } catch (error) {
    throw new Error(`Supabase login failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function register(payload: RegisterRequest): Promise<LoginResponse> {
  try {
    const response = await supabaseSignUp(payload.email, payload.password, {
      name: payload.name,
      location: payload.location,
      farmSize: payload.farmSize,
      farmerType: payload.farmerType,
      analyticsConsent: payload.analyticsConsent,
      role: payload.role,
    });
    await tokenStorage.setTokens(response.tokens);
    return response;
  } catch (error) {
    throw new Error(`Supabase signup failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function logout(): Promise<void> {
  try {
    await supabaseSignOut();
  } catch {
    // Ignore errors on logout
  }
  await tokenStorage.clearTokens();
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await getSupabaseSession();
    if (!session) return null;

    // Optionally fetch full user profile from DB
    return null;
  } catch {
    return null;
  }
}
