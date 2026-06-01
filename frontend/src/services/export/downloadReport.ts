import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/** Save JSON analytics export — downloads on web, opens share sheet on mobile */
export async function saveAnalyticsJson(filename: string, payload: unknown): Promise<string> {
  const json = JSON.stringify(payload, null, 2);

  if (Platform.OS === 'web') {
    if (typeof document === 'undefined') {
      throw new Error('Download is not available in this environment');
    }
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    return filename;
  }

  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, json, { encoding: 'utf8' });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Verdora analytics',
      UTI: 'public.json',
    });
  }

  return uri;
}
