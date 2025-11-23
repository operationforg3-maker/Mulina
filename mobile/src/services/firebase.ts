import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

let app: FirebaseApp | null = null;

function hasValidConfig(cfg: Record<string, any>) {
  return Boolean(cfg.apiKey && cfg.projectId && cfg.appId);
}

export function getFirebaseApp(): FirebaseApp | null {
  if (app) return app;

  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  } as const;

  if (!hasValidConfig(config)) {
    console.warn('Firebase config missing. Skipping init until EXPO_PUBLIC_* are set.');
    return null;
  }

  app = getApps()[0] ?? initializeApp(config as any);
  return app;
}

export const firebaseAuth = () => {
  const a = getFirebaseApp();
  return a ? getAuth(a) : null;
};

export const firebaseDb = () => {
  const a = getFirebaseApp();
  return a ? getFirestore(a) : null;
};

export const firebaseStorage = () => {
  const a = getFirebaseApp();
  return a ? getStorage(a) : null;
};
