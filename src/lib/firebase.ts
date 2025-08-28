import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApET8-Esu22RoYeldw6USghH9NV3vSQyY",
  authDomain: "quizmanagement-8207e.firebaseapp.com",
  projectId: "quizmanagement-8207e",
  storageBucket: "quizmanagement-8207e.firebasestorage.app",
  messagingSenderId: "137678753393",
  appId: "1:137678753393:web:32a414898af4ac719595d0",
  measurementId: "G-BZCXD15L2K"
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
