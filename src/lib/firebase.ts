import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY_PLACEHOLDER",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN_PLACEHOLDER",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID_PLACEHOLDER",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET_PLACEHOLDER",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID_PLACEHOLDER",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID_PLACEHOLDER",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "YOUR_MEASUREMENT_ID_PLACEHOLDER"
};

// Initialize Firebase
let firebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApps()[0];
}

// Initialize Firebase services
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// Initialize Analytics conditionally (only in browser environment)
// Instead of exporting analytics directly, we'll create a function to get it

// We'll use a lazy initialization approach
let analyticsInstance: any = null;
let analyticsInitialized = false;

// Function to get analytics that can be called when needed
const getFirebaseAnalytics = () => {
  // If we've already tried to initialize, just return what we have
  if (analyticsInitialized) {
    return analyticsInstance;
  }
  
  // Only run in browser environment
  if (typeof window !== 'undefined') {
    try {
      // Mark as initialized so we don't try again
      analyticsInitialized = true;
      
      // Initialize analytics
      analyticsInstance = getAnalytics(firebaseApp);
      return analyticsInstance;
    } catch (error) {
      console.error('Analytics initialization error:', error);
      return null;
    }
  }
  return null;
};

// Don't initialize immediately, let components call getFirebaseAnalytics when needed

export { auth, db, getFirebaseAnalytics };

// For backward compatibility with existing code
export const analytics = null; // This ensures existing code doesn't break
