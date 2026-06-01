import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

function downloadBase64Pdf(base64: string, filename: string): void {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Generate PDF from HTML and download (web) or share (mobile) */
export async function saveAnalyticsPdf(filename: string, html: string): Promise<string> {
  const result = await Print.printToFileAsync({
    html,
    base64: Platform.OS === 'web',
  });

  if (Platform.OS === 'web') {
    if (result.base64) {
      downloadBase64Pdf(result.base64, filename);
      return filename;
    }
    if (result.uri?.startsWith('blob:')) {
      const link = document.createElement('a');
      link.href = result.uri;
      link.download = filename;
      link.click();
      return filename;
    }
    throw new Error('PDF download failed in this browser. Try Export JSON instead.');
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Export Verdora analytics PDF',
      UTI: 'com.adobe.pdf',
    });
  }

  return result.uri;
}
