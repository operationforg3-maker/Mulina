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
  };
  estimated_time: number;
  progress?: {
    completed_stitches: boolean[][]; // true = done, false = todo
    current_color_index: number;
    last_worked: string;
  };
}

export interface PatternListItem {
  pattern_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  thumbnail?: string;
  width_stitches: number;
  height_stitches: number;
  color_count: number;
  progress_percent: number;
}

/**
 * Save a pattern to local storage
 */
export async function savePattern(pattern: StoredPattern): Promise<void> {
  try {
    const key = `${STORAGE_KEY_PREFIX}${pattern.pattern_id}`;
    await AsyncStorage.setItem(key, JSON.stringify(pattern));
    
    // Update patterns list
    await updatePatternsList(pattern);
  } catch (error) {
    console.error('Error saving pattern:', error);
    throw new Error('Failed to save pattern');
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

/**
 * Update patterns list with new/updated pattern info
 */
async function updatePatternsList(pattern: StoredPattern): Promise<void> {
  const list = await getPatternsList();
  
  // Calculate progress percentage
  let progressPercent = 0;
  if (pattern.progress?.completed_stitches) {
    const totalStitches = pattern.dimensions.width_stitches * pattern.dimensions.height_stitches;
    const completedCount = pattern.progress.completed_stitches.flat().filter(Boolean).length;
    progressPercent = Math.round((completedCount / totalStitches) * 100);
  }
  
  const listItem: PatternListItem = {
    pattern_id: pattern.pattern_id,
    name: pattern.name,
    created_at: pattern.created_at,
    updated_at: pattern.updated_at,
    thumbnail: pattern.thumbnail,
    width_stitches: pattern.dimensions.width_stitches,
    height_stitches: pattern.dimensions.height_stitches,
    color_count: pattern.color_palette.length,
    progress_percent: progressPercent,
  };
  
  // Remove old entry if exists
  const filteredList = list.filter(p => p.pattern_id !== pattern.pattern_id);
  
  // Add new entry
  filteredList.unshift(listItem);
  
  await AsyncStorage.setItem(PATTERNS_LIST_KEY, JSON.stringify(filteredList));
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
