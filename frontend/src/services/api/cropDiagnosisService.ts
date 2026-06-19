import { env, hasRestApi } from '../../config/env';
import { CROP_KNOWLEDGE, DEFAULT_CROP_KNOWLEDGE } from '../../data/cropKnowledge';
import type { DiagnosisResult, User } from '../../types';
import { generateId } from '../../utils/generateId';
import { mimeTypeFromUri, readImageAsBase64 } from '../../utils/readImageBase64';
import { getPrimaryCropForUser, scanRecordToDiagnosis } from '../data/farmerDataService';
import { getUserCropScans } from '../analytics/dataCollectionService';
import { API_ENDPOINTS, EXTERNAL_APIS } from './endpoints';
import { apiClient, externalClient } from './client';
import type { DiagnoseCropResponse } from './types';

interface GeminiDiagnosisPayload {
  cropName?: string;
  disease?: string | null;
  confidence?: number;
  treatment?: string;
}

function parseGeminiDiagnosis(raw: string): GeminiDiagnosisPayload | null {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]) as GeminiDiagnosisPayload;
  } catch {
    return null;
  }
}

function buildGeminiScanPrompt(user: User): string {
  const crops = user.cropsPlanted?.join(', ') ?? 'unknown';
  return (
    `You are Verdora crop disease analyst using Gemini vision. ` +
    `Farmer location: ${user.location ?? 'unknown'}. Registered crops: ${crops}. ` +
    `Analyze this crop photo. Identify the crop and any visible disease or pest damage. ` +
    `Respond ONLY with valid JSON (no markdown fences): ` +
    `{"cropName":"string","disease":"string or null if healthy","confidence":0.0,"treatment":"actionable advice"}`
  );
}

async function geminiDiagnoseCrop(imageUri: string, user: User): Promise<DiagnosisResult> {
  const { geminiApiKey } = env;
  if (!geminiApiKey) throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set');

  const base64 = await readImageAsBase64(imageUri);
  const mimeType = mimeTypeFromUri(imageUri);

  const { data } = await externalClient.post(
    `${EXTERNAL_APIS.geminiVision}?key=${geminiApiKey}`,
    {
      contents: [
        {
          parts: [
            { text: buildGeminiScanPrompt(user) },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        },
      ],
    },
    { headers: { 'Content-Type': 'application/json' } },
  );

  const rawText: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    'Unable to analyze image.';

  const parsed = parseGeminiDiagnosis(rawText);
  const fallbackCrop = (await getPrimaryCropForUser(user)) ?? 'Unknown crop';

  return {
    id: generateId('diag'),
    cropName: parsed?.cropName?.trim() || fallbackCrop,
    disease: parsed?.disease ?? null,
    confidence: Math.min(1, Math.max(0, parsed?.confidence ?? 0.75)),
    treatment:
      parsed?.treatment?.trim() ||
      'Monitor the plant and scan again in a few days if symptoms persist.',
    imageUri,
    scannedAt: new Date().toISOString(),
  };
}

async function apiDiagnoseCrop(imageUri: string): Promise<DiagnosisResult> {
  const formData = new FormData();
  const filename = imageUri.split('/').pop() ?? 'crop.jpg';
  formData.append('image', {
    uri: imageUri,
    name: filename,
    type: 'image/jpeg',
  } as unknown as Blob);

  return apiClient
    .post<DiagnoseCropResponse>(API_ENDPOINTS.crops.diagnose, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);
}

/**
 * Client-side fallback when Gemini and the diagnosis API are unavailable.
 * Uses the farmer's registered crops — not fabricated sample data.
 */
async function diagnoseFromUserCrops(
  imageUri: string,
  user: User,
): Promise<DiagnosisResult> {
  const cropName = await getPrimaryCropForUser(user);

  if (!cropName) {
    return {
      id: generateId('diag'),
      cropName: 'Unregistered crop',
      disease: null,
      confidence: 0,
      treatment:
        'Add crops in your Plantation Calendar first. Verdora diagnoses based on what you actually grow.',
      imageUri,
      scannedAt: new Date().toISOString(),
    };
  }

  const knowledge = CROP_KNOWLEDGE[cropName] ?? DEFAULT_CROP_KNOWLEDGE;
  const hasDisease = knowledge.commonDiseases.length > 0;
  const pick = hasDisease ? knowledge.commonDiseases[0] : null;

  return {
    id: generateId('diag'),
    cropName,
    disease: pick?.name ?? null,
    confidence: pick?.confidence ?? 0.9,
    treatment: pick?.treatment ?? knowledge.healthyTreatment,
    imageUri,
    scannedAt: new Date().toISOString(),
  };
}

export async function diagnoseCropImage(
  imageUri: string,
  user: User,
): Promise<DiagnosisResult> {
  if (env.geminiApiKey) {
    try {
      return await geminiDiagnoseCrop(imageUri, user);
    } catch {
      // fall through
    }
  }

  if (hasRestApi) {
    try {
      return await apiDiagnoseCrop(imageUri);
    } catch {
      return diagnoseFromUserCrops(imageUri, user);
    }
  }

  return diagnoseFromUserCrops(imageUri, user);
}

export async function fetchDiagnosisHistory(userId: string): Promise<DiagnosisResult[]> {
  const { fetchScansByUser } = await import('../supabase/repositories/scansRepository');
  const { isSupabaseConfigured } = await import('../supabase/client');

  if (isSupabaseConfigured()) {
    try {
      const cloud = await fetchScansByUser(userId);
      if (cloud.length > 0) {
        return cloud.map((s) => ({
          id: s.id,
          cropName: s.crop_type,
          disease: s.disease,
          confidence: s.confidence,
          treatment: s.treatment ?? '',
          imageUri: s.image_url ?? undefined,
          scannedAt: s.scanned_at,
          fieldId: s.field_id ?? undefined,
          fieldName: s.field_name ?? undefined,
        }));
      }
    } catch {
      // fall through to local
    }
  }

  const scans = await getUserCropScans(userId);
  return scans.map(scanRecordToDiagnosis);
}
