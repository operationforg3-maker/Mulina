import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import apiService from './api';

/**
 * Eksportuje PDF wzoru i otwiera systemowy dialog udostępniania/zapisu (lub pobiera na Web).
 * @param patternId string
 */
export async function exportPatternPdf(patternId: string): Promise<void> {
  const pdfBlob = await apiService.exportPdf(patternId);

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pattern_${patternId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return;
  }

  // Convert Blob to base64 for Expo FileSystem
  const reader = new FileReader();
  const base64 = await new Promise<string>((resolve, reject) => {
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64String = result.split(',')[1] || result;
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(pdfBlob);
  });

  const fileUri = FileSystem.cacheDirectory + `pattern_${patternId}.pdf`;
  await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
  await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf' });
}
