import "server-only";
import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        return cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
      } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY", e);
      }
  }

  try {
      // Use the local file if available.
      // Note: This file path is relative to this module.
      const serviceAccount = require("../../studio-9515986273-e951e-firebase-adminsdk-fbsvc-9d37e5556e.json");
      return cert(serviceAccount);
  } catch (e) {
      // Fallback to Application Default Credentials (ADC)
      // This is useful for Google Cloud environments (App Engine, Cloud Run, etc.)
      console.log("Using Application Default Credentials");
      return applicationDefault();
  }
}

export function initAdmin() {
  if (getApps().length === 0) {
    initializeApp({
      credential: getCredential(),
    });
  }
}

export function getAdminDb() {
  initAdmin();
  return getFirestore();
}
