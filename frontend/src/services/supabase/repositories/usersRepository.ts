import type { User } from '../../../types';
import type { InsertDbUser } from '../../../types/database';
import { getSupabase, isSupabaseConfigured } from '../client';

export function userToDbRow(user: User, dataConsent: boolean): InsertDbUser {
  const now = new Date().toISOString();
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    location: user.location ?? null,
    latitude: user.latitude ?? null,
    longitude: user.longitude ?? null,
    farm_size: user.farmSize ?? null,
    farmer_type: user.farmerType ?? null,
    crop_preferences: user.cropsPlanted ?? user.cropPreferences ?? [],
    soil_type: user.soilType ?? null,
    farming_methods: user.farmingMethods ?? [],
    data_consent: dataConsent,
    data_consent_at: dataConsent ? now : null,
    created_at: user.createdAt ?? now,
    updated_at: now,
  };
}

export async function upsertUser(user: User, dataConsent: boolean): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  const row = userToDbRow(user, dataConsent);
  const { error } = await sb.from('users').upsert(row, { onConflict: 'id' });
  if (error) console.warn('[Verdora] Supabase users upsert:', error.message);
}

export async function updateUserConsent(
  userId: string,
  dataConsent: boolean,
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  const { error } = await sb
    .from('users')
    .update({
      data_consent: dataConsent,
      data_consent_at: dataConsent ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) console.warn('[Verdora] Supabase consent update:', error.message);
}

export async function fetchAllUsers(): Promise<import('../../../types/database').DbUser[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb.from('users').select('*').order('created_at', {
    ascending: false,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as import('../../../types/database').DbUser[];
}

export function isCloudEnabled(): boolean {
  return isSupabaseConfigured();
}
