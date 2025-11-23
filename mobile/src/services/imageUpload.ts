import { firebaseStorage } from './firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

/**
 * Uploads a local image (URI) to Firebase Storage and returns the download URL.
 * @param localUri string - local file URI (from ImagePicker)
 * @param userId string - user ID or 'anon' if not logged in
 * @returns Promise<string> - download URL
 */
export async function uploadImageToFirebase(localUri: string, userId: string = 'anon'): Promise<string> {
  const storage = firebaseStorage();
  if (!storage) throw new Error('Firebase Storage not initialized');

  // Generate unique filename
  const filename = `${userId}/images/${Date.now()}_${Math.floor(Math.random() * 10000)}.jpg`;
  const storageRef = ref(storage, filename);

  // Fetch the file as blob
  const response = await fetch(localUri);
  const blob = await response.blob();

  // Upload blob
  await uploadBytes(storageRef, blob);
  // Get download URL
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}
