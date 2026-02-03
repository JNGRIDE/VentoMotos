// This file is not version controlled.
// This is a placeholder file. Replace with your own firebase config.

// To get this value:
// 1. Go to your Firebase project console.
// 2. In the left-hand menu, click the gear icon, then "Project settings".
// 3. In the "Your apps" card, select the app for which you need to get the config object.
// 4. In the "Firebase SDK snippet" pane, select "Config".
// 5. Copy the config object snippet, and create environment variables in your deployment platform (e.g., Vercel).

// --- VERCEL DEPLOYMENT INSTRUCTIONS ---
// The error "(auth/invalid-api-key)" means these variables are not set in Vercel.
//
// 1. Go to your Vercel Project -> Settings -> Environment Variables.
// 2. Add a new variable for EACH of the items below (e.g., NEXT_PUBLIC_API_KEY).
// 3. Copy the value from your original Firebase config.
// 4. Re-deploy your project for the changes to take effect.
//
// The 'NEXT_PUBLIC_' prefix is REQUIRED by Next.js for the browser to access them.

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
};
