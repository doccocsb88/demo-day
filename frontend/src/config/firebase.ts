import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyC-TQ2Lwe_9F6kK1WSJNuLqD-xNQdvsbDg',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'upwork-tiktok.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'upwork-tiktok',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'upwork-tiktok.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '419013944763',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:419013944763:web:c5778e89d4bb27e9fe109e',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-BZ48ZVKBZW',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser environment)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export const auth = getAuth(app);
export { analytics };
export default app;

