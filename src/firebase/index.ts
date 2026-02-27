import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
};

let firebaseServices: FirebaseServices | null = null;

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

export {
  FirebaseProvider,
  useFirebase,
  useFirebaseApp,
  useAuth,
  useFirestore,
  useStorage,
} from "./provider";

export { FirebaseClientProvider } from "./client-provider";
