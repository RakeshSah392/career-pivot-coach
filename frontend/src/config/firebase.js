/**
 * firebase.js
 *
 * Client Firebase SDK initialization for Career Pivot Coach.
 * Reads Web App credentials from Vite environment variables (VITE_FIREBASE_*).
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'career-pivot-coach.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'career-pivot-coach',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'career-pivot-coach.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== ''
);

let app;
let auth;

if (isFirebaseConfigured) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
} else {
  // Graceful initialization or null when API key is not yet set
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (err) {
    console.warn(
      '[Firebase] Client SDK initialized in pending configuration mode. Provide VITE_FIREBASE_API_KEY in frontend/.env to enable live authentication.',
      err.message
    );
  }
}

export { app, auth };
export default auth;

