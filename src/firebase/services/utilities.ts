import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  setDoc,
  type Firestore,
} from "firebase/firestore";
import type { Utility, NewUtility } from "@/lib/data";
import { fromFirestore } from "./utils";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors";

export async function getUtilities(db: Firestore): Promise<Utility[]> {
  const utilitiesCol = collection(db, "utilities");
  const q = query(utilitiesCol, orderBy("title"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => fromFirestore<Utility>(doc));
}

export async function addUtility(db: Firestore, utility: NewUtility): Promise<string> {
  const utilitiesCol = collection(db, "utilities");
  const docRef = doc(utilitiesCol);
  
  // Iniciamos la escritura de forma no bloqueante para mejor UX
  setDoc(docRef, utility)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'create',
        requestResourceData: utility,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });

  return docRef.id;
}

export async function updateUtility(db: Firestore, id: string, updates: Partial<Utility>): Promise<void> {
  const docRef = doc(db, "utilities", id);
  updateDoc(docRef, updates)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: updates,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });
}

export async function removeUtility(db: Firestore, id: string): Promise<void> {
  const docRef = doc(db, "utilities", id);
  deleteDoc(docRef)
    .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });
}
