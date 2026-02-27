"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import { initializeFirebase } from ".";
import { FirebaseErrorListener } from "@/components/firebase-error-listener";

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
