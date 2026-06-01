import type { DiagnosisResult, User } from '../../../types';
import type { DbScan, InsertDbScan } from '../../../types/database';
import { getSupabase } from '../client';

export function diagnosisToScanRow(user: User, diagnosis: DiagnosisResult): InsertDbScan {
  return {
    id: diagnosis.id,
    user_id: user.id,
    image_url: diagnosis.imageUri ?? null,
    crop_type: diagnosis.cropName,
    disease: diagnosis.disease,
    confidence: diagnosis.confidence,
    treatment: diagnosis.treatment,
    location: user.location ?? null,
    latitude: user.latitude ?? null,
    longitude: user.longitude ?? null,
    scanned_at: diagnosis.scannedAt,
  };
}

export async function insertScan(user: User, diagnosis: DiagnosisResult): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;

  const { error } = await sb.from('scans').insert(diagnosisToScanRow(user, diagnosis));
  if (error) console.warn('[Verdora] Supabase scans insert:', error.message);
}

export async function fetchAllScans(): Promise<DbScan[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('scans')
    .select('*')
    .order('scanned_at', { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []) as DbScan[];
}

export async function fetchScansByUser(userId: string): Promise<DbScan[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('scans')
    .select('*')
    .eq('user_id', userId)
    .order('scanned_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DbScan[];
}
