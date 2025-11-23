import { firebaseDb, firebaseStorage } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { StoredPattern } from './patternStorage';

/**
 * Sync pattern to Firestore
 */
export async function syncPatternToFirestore(pattern: StoredPattern, userId: string): Promise<void> {
  const db = firebaseDb();
  if (!db) throw new Error('Firestore not initialized');

  const patternRef = doc(db, `users/${userId}/patterns`, pattern.pattern_id);
  await setDoc(patternRef, {
    ...pattern,
    synced_at: serverTimestamp(),
  });
}

/**
 * Fetch patterns from Firestore for user
 */
export async function fetchPatternsFromFirestore(userId: string): Promise<StoredPattern[]> {
  const db = firebaseDb();
  if (!db) throw new Error('Firestore not initialized');

  const patternsRef = collection(db, `users/${userId}/patterns`);
  const snapshot = await getDocs(patternsRef);
  
  return snapshot.docs.map(doc => doc.data() as StoredPattern);
}

/**
 * Upload pattern grid image to Firebase Storage (for backup)
 */
export async function uploadPatternGridImage(
  patternId: string,
  userId: string,
  imageBlob: Blob
): Promise<string> {
  const storage = firebaseStorage();
  if (!storage) throw new Error('Firebase Storage not initialized');

  const storageRef = ref(storage, `users/${userId}/patterns/${patternId}/grid.png`);
  await uploadBytes(storageRef, imageBlob);
  return await getDownloadURL(storageRef);
}

/**
 * Auto-sync: sync local patterns to Firestore when online
 */
export async function autoSyncPatterns(
  localPatterns: StoredPattern[],
  userId: string
): Promise<void> {
  for (const pattern of localPatterns) {
    try {
      await syncPatternToFirestore(pattern, userId);
    } catch (error) {
      console.error(`Failed to sync pattern ${pattern.pattern_id}:`, error);
    }
  }
}
