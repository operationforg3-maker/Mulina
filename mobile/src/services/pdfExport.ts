import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import apiService from './api';

/**
 * Eksportuje PDF wzoru i otwiera systemowy dialog udostępniania/zapisu.
 * @param patternId string
 */
export async function exportPatternPdf(patternId: string): Promise<void> {
  // Pobierz PDF jako blob
  const pdfBlob = await apiService.exportPdf(patternId);
  // Zapisz do pliku tymczasowego
  const fileUri = FileSystem.cacheDirectory + `pattern_${patternId}.pdf`;
  await FileSystem.writeAsStringAsync(fileUri, pdfBlob, { encoding: FileSystem.EncodingType.Base64 });
  // Otwórz dialog udostępniania/zapisu
  await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf' });
}
