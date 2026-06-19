import * as FileSystem from 'expo-file-system/legacy';

/** Read a local image URI as base64 for vision API requests. */
export async function readImageAsBase64(imageUri: string): Promise<string> {
  return FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

/** Guess MIME type from a file URI. */
export function mimeTypeFromUri(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  return 'image/jpeg';
}
