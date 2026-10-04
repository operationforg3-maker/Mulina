/**
 * Pattern Storage Service
 * Handles local persistence of patterns using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_PREFIX = '@mulina_pattern_';
const PATTERNS_LIST_KEY = '@mulina_patterns_list';

export interface StoredPattern {
  pattern_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  thumbnail?: string; // base64 image
  image_url?: string; // Firebase Storage URL
  favorite?: boolean;
  tags?: string[];
  grid_data: {
    grid: number[][];
    type: string;
    width: number;
    height: number;
  };
  color_palette: Array<{
    rgb: number[];
    thread_code: string;
    thread_brand: string;
    thread_name: string;
    symbol: string;
    delta_e: number;
  }>;
  dimensions: {
    width_stitches: number;
    height_stitches: number;
    width_cm: number;
    height_cm: number;
    aida_count?: number;
    canvas_color?: string;
    margin_cm?: number;
    recommended_cut_width_cm?: number;
    recommended_cut_height_cm?: number;
  };
  backstitch?: Array<{
    id: string;
    x1: number; // grid intersection (0 to width)
    y1: number; // grid intersection (0 to height)
    x2: number;
    y2: number;
    color_index: number;
    completed?: boolean;
  }>;
  parked_threads?: Array<{
    r: number;
    c: number;
    corner: 'NW' | 'NE' | 'SW' | 'SE';
    thread_code: string;
    color_index: number;
  }>;
  blends?: Array<{
    id: string;
    symbol: string;
    threads: Array<{ brand: string; code: string; strands: number; rgb?: number[] }>;
  }>;
  brand_source?: string;
  materials_summary?: {
    total_stitches: number;
    total_skeins: number;
    estimated_cost_pln: number;
    fabric_cut_size: string;
    fabric_type: string;
    canvas_color?: string;
  };
  estimated_time: number;
  progress?: {
    completed_stitches: boolean[][]; // true = done, false = todo
    completed_backstitch?: string[]; // IDs of completed backstitches
    current_color_index: number;
    last_worked: string;
    stitches_per_session?: number;
  };
}

export interface PatternListItem {
  pattern_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  thumbnail?: string;
  image_url?: string;
  width_stitches: number;
  height_stitches: number;
  color_count: number;
  progress_percent: number;
  favorite?: boolean;
  tags?: string[];
  preview_colors?: string[];
  total_stitches?: number;
}

/**
 * Prune oldest patterns if localStorage quota is tight
 */
async function pruneOldPatterns(keepCount: number = 6): Promise<void> {
  try {
    const list = await getPatternsList();
    if (list.length > keepCount) {
      const toDelete = list.slice(keepCount);
      for (const item of toDelete) {
        await AsyncStorage.removeItem(`${STORAGE_KEY_PREFIX}${item.pattern_id}`);
      }
      const keptList = list.slice(0, keepCount);
      await AsyncStorage.setItem(PATTERNS_LIST_KEY, JSON.stringify(keptList));
    }
  } catch (e) {
    console.warn('Error pruning old patterns:', e);
  }
}

/**
 * Save a pattern to local storage (safe, without destructive pruning)
 */
export async function savePattern(pattern: StoredPattern): Promise<void> {
  try {
    const safePattern = { ...pattern };
    // Strip giant base64 data URIs from persistent storage to prevent QuotaExceededError
    if (safePattern.image_url && safePattern.image_url.startsWith('data:') && safePattern.image_url.length > 50000) {
      delete (safePattern as any).image_url;
    }
    if (safePattern.thumbnail && safePattern.thumbnail.startsWith('data:') && safePattern.thumbnail.length > 50000) {
      delete (safePattern as any).thumbnail;
    }

    const key = `${STORAGE_KEY_PREFIX}${pattern.pattern_id}`;
    await AsyncStorage.setItem(key, JSON.stringify(safePattern));
    
    // Update patterns list
    await updatePatternsList(safePattern);
  } catch (error) {
    console.warn('Warning: Could not persist pattern to local storage:', error);
    // Graceful fallback
  }
}

/**
 * Load a pattern from local storage
 */
export async function loadPattern(patternId: string): Promise<StoredPattern | null> {
  try {
    const key = `${STORAGE_KEY_PREFIX}${patternId}`;
    const data = await AsyncStorage.getItem(key);
    
    if (!data) {
      return null;
    }
    
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading pattern:', error);
    return null;
  }
}

/**
 * Delete a pattern from local storage
 */
export async function deletePattern(patternId: string): Promise<void> {
  try {
    const key = `${STORAGE_KEY_PREFIX}${patternId}`;
    await AsyncStorage.removeItem(key);
    
    // Update patterns list
    const list = await getPatternsList();
    const updatedList = list.filter(p => p.pattern_id !== patternId);
    await AsyncStorage.setItem(PATTERNS_LIST_KEY, JSON.stringify(updatedList));
  } catch (error) {
    console.error('Error deleting pattern:', error);
    throw new Error('Failed to delete pattern');
  }
}

/**
 * Rename an existing pattern
 */
export async function renamePattern(patternId: string, newName: string): Promise<StoredPattern | null> {
  const pattern = await loadPattern(patternId);
  if (!pattern) return null;
  pattern.name = newName.trim();
  pattern.updated_at = new Date().toISOString();
  await savePattern(pattern);
  return pattern;
}

/**
 * Duplicate a pattern with a new ID
 */
export async function duplicatePattern(patternId: string): Promise<StoredPattern | null> {
  const original = await loadPattern(patternId);
  if (!original) return null;
  const newId = `pat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const clone: StoredPattern = {
    ...JSON.parse(JSON.stringify(original)),
    pattern_id: newId,
    name: `${original.name} (Kopia)`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await savePattern(clone);
  return clone;
}

/**
 * Toggle favorite status of a pattern
 */
export async function toggleFavoritePattern(patternId: string): Promise<boolean> {
  const pattern = await loadPattern(patternId);
  if (!pattern) return false;
  pattern.favorite = !pattern.favorite;
  pattern.updated_at = new Date().toISOString();
  await savePattern(pattern);
  return !!pattern.favorite;
}

/**
 * Update tags of a pattern
 */
export async function updatePatternTags(patternId: string, tags: string[]): Promise<void> {
  const pattern = await loadPattern(patternId);
  if (!pattern) return;
  pattern.tags = tags;
  pattern.updated_at = new Date().toISOString();
  await savePattern(pattern);
}

/**
 * Reset pattern progress (0% completed stitches)
 */
export async function resetPatternProgress(patternId: string): Promise<void> {
  const pattern = await loadPattern(patternId);
  if (!pattern || !pattern.grid_data) return;
  const h = pattern.grid_data.height;
  const w = pattern.grid_data.width;
  pattern.progress = {
    completed_stitches: Array(h).fill(null).map(() => Array(w).fill(false)),
    current_color_index: 0,
    last_worked: new Date().toISOString(),
  };
  if (pattern.backstitch) {
    pattern.backstitch = pattern.backstitch.map(b => ({ ...b, completed: false }));
  }
  pattern.updated_at = new Date().toISOString();
  await savePattern(pattern);
}

/**
 * Export a single pattern as JSON file string
 */
export async function exportPatternJson(patternId: string): Promise<string> {
  const pattern = await loadPattern(patternId);
  if (!pattern) throw new Error('Nie znaleziono wzoru');
  return JSON.stringify(pattern, null, 2);
}

/**
 * Export full backup of all stored patterns
 */
export async function exportAllPatternsBackup(): Promise<string> {
  const list = await getPatternsList();
  const allPatterns: StoredPattern[] = [];
  for (const item of list) {
    const p = await loadPattern(item.pattern_id);
    if (p) allPatterns.push(p);
  }
  const backup = {
    app: "Mu'Alina",
    version: "2.0",
    exported_at: new Date().toISOString(),
    patterns_count: allPatterns.length,
    patterns: allPatterns,
  };
  return JSON.stringify(backup, null, 2);
}

/**
 * Import and merge patterns from a backup JSON
 */
export async function importPatternsBackup(backupJson: string): Promise<number> {
  const parsed = JSON.parse(backupJson);
  const patternsToImport: StoredPattern[] = Array.isArray(parsed) ? parsed : (parsed.patterns || []);
  let importedCount = 0;
  for (const p of patternsToImport) {
    if (p && p.pattern_id && p.grid_data && p.color_palette) {
      await savePattern(p);
      importedCount++;
    }
  }
  return importedCount;
}

/**
 * Get list of all saved patterns
 */
export async function getPatternsList(): Promise<PatternListItem[]> {
  try {
    const data = await AsyncStorage.getItem(PATTERNS_LIST_KEY);
    
    if (!data) {
      return [];
    }
    
    const list: PatternListItem[] = JSON.parse(data);
    // Sort by updated_at descending (most recent first)
    return list.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  } catch (error) {
    console.error('Error getting patterns list:', error);
    return [];
  }
}

export const listRecentPatterns = getPatternsList;

/**
 * Update patterns list with new/updated pattern info
 */
async function updatePatternsList(pattern: StoredPattern): Promise<void> {
  try {
    const list = await getPatternsList();
    
    // Calculate progress percentage
    let progressPercent = 0;
    if (pattern.progress?.completed_stitches) {
      const totalStitches = pattern.dimensions.width_stitches * pattern.dimensions.height_stitches;
      const completedCount = pattern.progress.completed_stitches.flat().filter(Boolean).length;
      progressPercent = Math.round((completedCount / totalStitches) * 100);
    }

    const previewColors = (pattern.color_palette || []).slice(0, 7).map(t => `rgb(${t.rgb[0]},${t.rgb[1]},${t.rgb[2]})`);
    const totalStitches = pattern.dimensions ? pattern.dimensions.width_stitches * pattern.dimensions.height_stitches : 0;
    
    // Check if existing item has custom tags or favorite status
    const existing = list.find(p => p.pattern_id === pattern.pattern_id);

    const listItem: PatternListItem = {
      pattern_id: pattern.pattern_id,
      name: pattern.name,
      created_at: pattern.created_at,
      updated_at: pattern.updated_at,
      thumbnail: pattern.thumbnail && pattern.thumbnail.length < 50000 ? pattern.thumbnail : undefined,
      image_url: pattern.image_url && !pattern.image_url.startsWith('data:') ? pattern.image_url : undefined,
      width_stitches: pattern.dimensions.width_stitches,
      height_stitches: pattern.dimensions.height_stitches,
      color_count: pattern.color_palette.length,
      progress_percent: progressPercent,
      favorite: pattern.favorite ?? existing?.favorite ?? false,
      tags: pattern.tags ?? existing?.tags ?? [],
      preview_colors: previewColors,
      total_stitches: totalStitches,
    };
    
    // Remove old entry if exists
    const filteredList = list.filter(p => p.pattern_id !== pattern.pattern_id);
    
    // Add new entry to top
    filteredList.unshift(listItem);
    
    // Keep up to 250 entries in library list
    const trimmed = filteredList.slice(0, 250);
    
    await AsyncStorage.setItem(PATTERNS_LIST_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Could not update patterns list in storage:', err);
  }
}

/**
 * Update pattern progress
 */
export async function updatePatternProgress(
  patternId: string,
  completedStitches: boolean[][],
  currentColorIndex: number
): Promise<void> {
  try {
    const pattern = await loadPattern(patternId);
    
    if (!pattern) {
      throw new Error('Pattern not found');
    }
    
    pattern.progress = {
      completed_stitches: completedStitches,
      current_color_index: currentColorIndex,
      last_worked: new Date().toISOString(),
    };
    
    pattern.updated_at = new Date().toISOString();
    
    await savePattern(pattern);
  } catch (error) {
    console.error('Error updating progress:', error);
    throw new Error('Failed to update progress');
  }
}

/**
 * Generate thumbnail from pattern grid
 */
export function generateThumbnail(
  grid: number[][],
  colorPalette: Array<{ rgb: number[] }>,
  maxSize: number = 200
): string {
  // This is a placeholder - in real implementation, you'd use Canvas API
  // or react-native-canvas to render the grid and convert to base64
  // For now, return empty string
  return '';
}

/**
 * Clear all patterns (for testing/reset)
 */
export async function clearAllPatterns(): Promise<void> {
  try {
    const list = await getPatternsList();
    
    // Remove all pattern data
    for (const item of list) {
      const key = `${STORAGE_KEY_PREFIX}${item.pattern_id}`;
      await AsyncStorage.removeItem(key);
    }
    
    // Clear list
    await AsyncStorage.removeItem(PATTERNS_LIST_KEY);
  } catch (error) {
    console.error('Error clearing patterns:', error);
    throw new Error('Failed to clear patterns');
  }
}

const STASH_STORAGE_KEY = '@mualina_user_stash';

export interface StashItem {
  brand: string;
  code: string;
  name: string;
  rgb: number[];
  skeins: number; // e.g. 1.0, 2.5
  assigned_wip?: string; // name or id of project
}

export async function getUserStash(): Promise<Record<string, StashItem>> {
  try {
    const data = await AsyncStorage.getItem(STASH_STORAGE_KEY);
    if (!data) {
      // Default initial stash with popular DMC threads
      return {
        'DMC_310': { brand: 'DMC', code: '310', name: 'Black', rgb: [0, 0, 0], skeins: 3 },
        'DMC_666': { brand: 'DMC', code: '666', name: 'Bright Red', rgb: [227, 28, 61], skeins: 1.5 },
        'DMC_Blanc': { brand: 'DMC', code: 'Blanc', name: 'White', rgb: [255, 255, 255], skeins: 2 },
        'DMC_415': { brand: 'DMC', code: '415', name: 'Pearl Gray', rgb: [211, 211, 214], skeins: 1 },
      };
    }
    return JSON.parse(data);
  } catch (e) {
    console.warn('Error loading stash:', e);
    return {};
  }
}

export async function saveUserStash(stash: Record<string, StashItem>): Promise<void> {
  try {
    await AsyncStorage.setItem(STASH_STORAGE_KEY, JSON.stringify(stash));
  } catch (e) {
    console.error('Error saving stash:', e);
  }
}

export async function addToStash(item: StashItem): Promise<void> {
  const current = await getUserStash();
  const key = `${item.brand}_${item.code}`;
  if (current[key]) {
    current[key].skeins = Math.round((current[key].skeins + item.skeins) * 10) / 10;
  } else {
    current[key] = item;
  }
  await saveUserStash(current);
}
