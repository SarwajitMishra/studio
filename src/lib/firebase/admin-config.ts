// In: satellite-app/src/lib/firebase/admin-config.ts
import * as admin from 'firebase-admin';

// Check if the app is already initialized to avoid errors
if (!admin.apps.length) {
  // Initialize the SDK without explicit credentials.
  // When deployed in a Google Cloud environment like App Hosting,
  // the SDK will automatically use the environment's service account.
  admin.initializeApp();
}

// Export the initialized admin instance
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
