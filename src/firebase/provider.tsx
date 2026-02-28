"use client";

import React, { createContext, useContext, useMemo } from "react";
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./config";
import { FirebaseErrorListener } from "@/components/firebase-error-listener";

type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
};

let firebaseServices: FirebaseServices | null = null;

/**
 * Inicializa los servicios de Firebase de forma segura en el cliente.
 * Se define aquí para evitar dependencias circulares con el archivo index.ts.
 */
export const initializeFirebase = (): FirebaseServices => {
  if (firebaseServices) {
    return firebaseServices;
  }

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error(
      "Firebase configuration is incomplete. Please make sure that NEXT_PUBLIC_API_KEY and other required Firebase environment variables are set correctly in your Vercel/deployment project settings."
    );
  }

  const apps = getApps();
  const app = apps.length ? apps[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);

  firebaseServices = { app, auth, firestore, storage };
  return firebaseServices;
};

type FirebaseContextValue = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
};

const FirebaseContext = createContext<FirebaseContextValue | undefined>(
  undefined
);

type FirebaseProviderProps = {
  children: React.ReactNode;
};

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const firebaseValue = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseContext.Provider value={firebaseValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextValue => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
};

export const useFirebaseApp = (): FirebaseApp => {
  return useFirebase().app;
};

export const useAuth = (): Auth => {
  return useFirebase().auth;
};

export const useFirestore = (): Firestore => {
  return useFirebase().firestore;
};

export const useStorage = (): FirebaseStorage => {
  return useFirebase().storage;
};
