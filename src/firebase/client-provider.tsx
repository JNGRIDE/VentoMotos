"use client";

import React from "react";
import { FirebaseProvider } from "./provider";

type FirebaseClientProviderProps = {
  children: React.ReactNode;
};

export const FirebaseClientProvider: React.FC<FirebaseClientProviderProps> = ({
  children,
}) => {
  return <FirebaseProvider>{children}</FirebaseProvider>;
};
