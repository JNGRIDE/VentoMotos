/**
 * Barrel file para las utilidades de Firebase.
 * Re-exporta la lógica definida en los proveedores para evitar ciclos de importación.
 */
export {
  initializeFirebase,
  FirebaseProvider,
  useFirebase,
  useFirebaseApp,
  useAuth,
  useFirestore,
  useStorage,
} from "./provider";

export { FirebaseClientProvider } from "./client-provider";
