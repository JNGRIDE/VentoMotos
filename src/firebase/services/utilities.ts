import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  type Firestore,
} from "firebase/firestore";
import type { Utility, NewUtility } from "@/lib/data";
import { fromFirestore } from "./utils";

export async function getUtilities(db: Firestore): Promise<Utility[]> {
  const utilitiesCol = collection(db, "utilities");
  const q = query(utilitiesCol, orderBy("title"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => fromFirestore<Utility>(doc));
}

export async function addUtility(db: Firestore, utility: NewUtility): Promise<string> {
  const utilitiesCol = collection(db, "utilities");
  // No usamos await aquí según las directrices de Firestore Mutation
  const docRef = await addDoc(utilitiesCol, utility);
  return docRef.id;
}

export async function updateUtility(db: Firestore, id: string, updates: Partial<Utility>): Promise<void> {
  const docRef = doc(db, "utilities", id);
  await updateDoc(docRef, updates);
}

export async function removeUtility(db: Firestore, id: string): Promise<void> {
  const docRef = doc(db, "utilities", id);
  await deleteDoc(docRef);
}