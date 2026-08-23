import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocFromServer,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

// CrownDesk Official Firebase Credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDMbpPJ4RAUzAQCXoY1hDFRcq-zWHCgjiI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'crowndisk-f682d.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'crowndisk-f682d',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'crowndisk-f682d.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '300664696471',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:300664696471:web:4aec87ef29aeb9d5a1c3d2',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-RD8LG541CF',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)'
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use long-polling transport for iframe sandbox / container compatibility to prevent 10s backend timeout warnings
let dbInstance: any;
try {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId);
} catch {
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = dbInstance;
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Safe, non-blocking connection check on startup
export async function validateFirestoreConnection(): Promise<boolean> {
  if (!auth.currentUser) {
    return true;
  }
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection check timeout')), 2500)
    );
    await Promise.race([
      getDocFromServer(doc(db, 'users', auth.currentUser.uid)),
      timeoutPromise,
    ]);
    return true;
  } catch {
    return false;
  }
}

export {
  signInWithPopup,
  fbSignOut,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocFromServer,
  addDoc,
  serverTimestamp
};

export default app;