import { StoredPattern } from './patternStorage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Export pattern to JSON format
 */
export async function exportToJson(pattern: StoredPattern): Promise<void> {
  const json = JSON.stringify(pattern, null, 2);
  const fileUri = FileSystem.cacheDirectory + `pattern_${pattern.pattern_id}.json`;
  await FileSystem.writeAsStringAsync(fileUri, json);
  await Sharing.shareAsync(fileUri, { mimeType: 'application/json' });
}

/**
 * Export pattern to XSD format (cross-stitch design format)
 */
export async function exportToXsd(pattern: StoredPattern): Promise<void> {
  const xsd = generateXsdContent(pattern);
  const fileUri = FileSystem.cacheDirectory + `pattern_${pattern.pattern_id}.xsd`;
  await FileSystem.writeAsStringAsync(fileUri, xsd);
  await Sharing.shareAsync(fileUri, { mimeType: 'text/xml' });
}

/**
 * Export pattern to PAT format (PCStitch format)
 */
export async function exportToPat(pattern: StoredPattern): Promise<void> {
  const pat = generatePatContent(pattern);
  const fileUri = FileSystem.cacheDirectory + `pattern_${pattern.pattern_id}.pat`;
  await FileSystem.writeAsStringAsync(fileUri, pat);
  await Sharing.shareAsync(fileUri, { mimeType: 'application/octet-stream' });
}

/**
 * Import pattern from JSON
 */
export async function importFromJson(jsonString: string): Promise<StoredPattern> {
  return JSON.parse(jsonString);
}

/**
 * Generate XSD content from pattern
 */
function generateXsdContent(pattern: StoredPattern): string {
  const { grid_data, color_palette, dimensions } = pattern;
  
  let xsd = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xsd += '<cross-stitch-pattern>\n';
  xsd += `  <title>${pattern.name || 'Untitled'}</title>\n`;
  xsd += `  <width>${dimensions.width_stitches}</width>\n`;
  xsd += `  <height>${dimensions.height_stitches}</height>\n`;
  xsd += '  <colors>\n';
  
  color_palette.forEach((color, idx) => {
    xsd += `    <color id="${idx}">\n`;
    xsd += `      <brand>${color.thread_brand}</brand>\n`;
    xsd += `      <code>${color.thread_code}</code>\n`;
    xsd += `      <name>${color.thread_name}</name>\n`;
    xsd += `      <rgb>${color.rgb.join(',')}</rgb>\n`;
    xsd += `      <symbol>${color.symbol}</symbol>\n`;
    xsd += `    </color>\n`;
  });
  
  xsd += '  </colors>\n';
  xsd += '  <stitches>\n';
  
  grid_data.grid.forEach((row, y) => {
    row.forEach((colorIdx, x) => {
      if (colorIdx >= 0) {
        xsd += `    <stitch x="${x}" y="${y}" color="${colorIdx}"/>\n`;
      }
    });
  });
  
  xsd += '  </stitches>\n';
  xsd += '</cross-stitch-pattern>\n';
  
  return xsd;
}

/**
 * Generate PAT content from pattern (simplified PCStitch format)
 */
function generatePatContent(pattern: StoredPattern): string {
  const { grid_data, color_palette, dimensions } = pattern;
  
  let pat = `[Pattern]\n`;
  pat += `Title=${pattern.name || 'Untitled'}\n`;
  pat += `Width=${dimensions.width_stitches}\n`;
  pat += `Height=${dimensions.height_stitches}\n`;
  pat += `Colors=${color_palette.length}\n\n`;
  
  pat += `[Colors]\n`;
  color_palette.forEach((color, idx) => {
    pat += `${idx}=${color.thread_brand} ${color.thread_code},${color.rgb.join(',')},${color.symbol}\n`;
  });
  
  pat += `\n[Grid]\n`;
  grid_data.grid.forEach((row, y) => {
    const rowData = row.map(c => c >= 0 ? c : '.').join(',');
    pat += `${y}=${rowData}\n`;
  });
  
  return pat;
}
