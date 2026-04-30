import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// This function ensures that we initialize Firebase only once.
function getOrInitializeApp(): FirebaseApp {
  if (!getApps().length) {
    // Validate that all required environment variables are present.
    if (!firebaseConfig.apiKey) {
      throw new Error('Missing Firebase API Key. Please check your environment variables.');
    }
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

export const app = getOrInitializeApp();

const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || 'resgatame'; 
export const db = getFirestore(app, databaseId);

export const auth = getAuth(app);
