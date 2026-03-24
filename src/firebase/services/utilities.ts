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
import { ref, uploadBytes, getDownloadURL, type FirebaseStorage } from "firebase/storage";
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
  
  try {
    await setDoc(docRef, utility);
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'create',
      requestResourceData: utility,
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
    throw serverError; // Re-throw to allow the calling component to handle the error properly
  }

  return docRef.id;
}

export async function uploadUtilityFile(storage: FirebaseStorage, file: File, category: string): Promise<string> {
  const timestamp = new Date().getTime();
  const storageRef = ref(storage, `utilities/${category}/${timestamp}_${file.name}`);
  
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return downloadURL;
}

export async function updateUtility(db: Firestore, id: string, updates: Partial<Utility>): Promise<void> {
  const docRef = doc(db, "utilities", id);
  try {
    await updateDoc(docRef, updates);
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: updates,
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
    throw serverError; // Re-throw so callers can handle the failure
  }
}

export async function removeUtility(db: Firestore, id: string): Promise<void> {
  const docRef = doc(db, "utilities", id);
  try {
    await deleteDoc(docRef);
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
    throw serverError; // Re-throw so callers can handle the failure
  }
}
