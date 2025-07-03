
import { initializeApp, getApp, getApps, type FirebaseOptions } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect, // Ensure this is imported
  getRedirectResult,  // Ensure this is imported
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfigValues = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log("DIAGNOSTIC: Firebase Config Being Used by App:");
console.log("API Key:", firebaseConfigValues.apiKey ? "Loaded" : "MISSING or UNDEFINED");
console.log("Auth Domain:", firebaseConfigValues.authDomain);
console.log("Project ID:", firebaseConfigValues.projectId);
console.log("Storage Bucket:", firebaseConfigValues.storageBucket);
console.log("Messaging Sender ID:", firebaseConfigValues.messagingSenderId);
console.log("App ID:", firebaseConfigValues.appId);
console.log("Measurement ID:", firebaseConfigValues.measurementId ? "Loaded" : "Optional, may be MISSING");


const firebaseConfig: FirebaseOptions = firebaseConfigValues;

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const storage = getStorage(app); // Initialize Firebase Storage
const db = getFirestore(app); // Initialize Firestore
const googleProvider = new GoogleAuthProvider();

export {
  app,
  auth,
  storage,
  db, // Export db
  googleProvider,
  signInWithRedirect, // Ensure this is exported
  getRedirectResult,  // Ensure this is exported
  signOut,
  onAuthStateChanged,
  updateProfile,
};
export type { User };


