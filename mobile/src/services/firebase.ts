import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import { Platform } from 'react-native';

let app: FirebaseApp | null = null;

function hasValidConfig(cfg: Record<string, any>) {
  return Boolean(cfg.apiKey && cfg.projectId && cfg.appId);
}

export function getFirebaseApp(): FirebaseApp | null {
  if (app) return app;

  const apiKey = Platform.select({
    ios: process.env.EXPO_PUBLIC_FIREBASE_API_KEY_IOS || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    android: process.env.EXPO_PUBLIC_FIREBASE_API_KEY_ANDROID || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    default: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  });

  const appId = Platform.select({
    ios: process.env.EXPO_PUBLIC_FIREBASE_APP_ID_IOS || process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    android: process.env.EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID || process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    default: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  });

  const config = {
    apiKey,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId,
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
