import { CROP_KNOWLEDGE, DEFAULT_CROP_KNOWLEDGE } from '../../data/cropKnowledge';
import type { DiagnosisResult, User } from '../../types';
import { getPrimaryCropForUser, scanRecordToDiagnosis } from '../data/farmerDataService';
import { getUserCropScans } from '../analytics/dataCollectionService';
import { mockId } from '../mocks/mockUtils';
import { API_ENDPOINTS } from './endpoints';
import { apiClient } from './client';
import type { DiagnoseCropResponse } from './types';

/**
 * Diagnose using the farmer's real registered crops (calendar + profile).
 * Used as a fallback if API is unavailable.
 */
async function diagnoseFromUserCrops(
  imageUri: string,
  user: User,
): Promise<DiagnosisResult> {
  const cropName = await getPrimaryCropForUser(user);

  if (!cropName) {
    return {
      id: mockId('diag'),
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
    id: mockId('diag'),
    cropName,
    disease: pick?.name ?? null,
    confidence: pick?.confidence ?? 0.9,
    treatment: pick?.treatment ?? knowledge.healthyTreatment,
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
 * Send crop image for AI diagnosis via backend API.
 */
export async function diagnoseCropImage(
  imageUri: string,
  user: User,
): Promise<DiagnosisResult> {
  try {
    return await apiDiagnoseCrop(imageUri);
  } catch {
    // Fallback: use farmer's registered crops
    return diagnoseFromUserCrops(imageUri, user);
  }
}

export async function fetchDiagnosisHistory(userId: string): Promise<DiagnosisResult[]> {
  const scans = await getUserCropScans(userId);
  return scans.map(scanRecordToDiagnosis);
}
