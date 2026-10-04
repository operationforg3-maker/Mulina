/**
 * Firebase Firestore Sync Service for Mu'Alina
 * Handles cloud backup and cross-device sync of patterns and progress
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { firebaseDb } from './firebase';
import {
  StoredPattern,
  loadPattern,
  savePattern,
  getPatternsList,
} from './patternStorage';

/**
 * Upload a single pattern to user's Firestore cloud collection
 */
export async function syncPatternToCloud(pattern: StoredPattern, userId: string): Promise<boolean> {
  const db = firebaseDb();
  if (!db || !userId) return false;

  try {
    const docRef = doc(db, 'users', userId, 'patterns', pattern.pattern_id);
    const cleanPattern = {
      ...pattern,
      userId,
      synced_at: new Date().toISOString(),
    };
    // Exclude large data URLs if any
    if (cleanPattern.image_url && cleanPattern.image_url.startsWith('data:')) {
      delete (cleanPattern as any).image_url;
    }
    if (cleanPattern.thumbnail && cleanPattern.thumbnail.startsWith('data:')) {
      delete (cleanPattern as any).thumbnail;
    }

    await setDoc(docRef, cleanPattern, { merge: true });
    return true;
  } catch (error) {
    console.warn('Error syncing pattern to cloud:', error);
    return false;
  }
}

/**
 * Backup all local patterns to Firestore
 */
export async function backupAllPatternsToCloud(userId: string): Promise<{ success: number; failed: number }> {
  const db = firebaseDb();
  if (!db || !userId) throw new Error('Brak połączenia z chmurą lub brak zalogowania');

  const list = await getPatternsList();
  let success = 0;
  let failed = 0;

  for (const item of list) {
    try {
      const fullPattern = await loadPattern(item.pattern_id);
      if (fullPattern) {
        const ok = await syncPatternToCloud(fullPattern, userId);
        if (ok) success++;
        else failed++;
      }
    } catch {
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Fetch and restore all patterns from user's Firestore cloud collection into local storage
 */
export async function restoreAllPatternsFromCloud(userId: string): Promise<number> {
  const db = firebaseDb();
  if (!db || !userId) throw new Error('Brak połączenia z chmurą lub brak zalogowania');

  const collRef = collection(db, 'users', userId, 'patterns');
  const snapshot = await getDocs(collRef);
  let count = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as StoredPattern;
    if (data && data.pattern_id && data.grid_data) {
      await savePattern(data);
      count++;
    }
  }

  return count;
}

/**
 * Delete a pattern from cloud
 */
export async function deletePatternFromCloud(patternId: string, userId: string): Promise<void> {
  const db = firebaseDb();
  if (!db || !userId) return;

  try {
    const docRef = doc(db, 'users', userId, 'patterns', patternId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Error deleting pattern from cloud:', e);
  }
}
