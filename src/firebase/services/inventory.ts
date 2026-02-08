import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  where,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import type { Motorcycle, NewMotorcycle } from "@/lib/data";
import { fromFirestore } from "./utils";

export async function getInventory(db: Firestore): Promise<Motorcycle[]> {
  const inventoryCol = collection(db, "inventory");
  const q = query(inventoryCol, orderBy("model"));
  const snapshot = await getDocs(q);
  const inventoryList = snapshot.docs.map(doc => fromFirestore<Motorcycle>(doc));
  return inventoryList;
}

export async function addMotorcycle(db: Firestore, motorcycle: NewMotorcycle): Promise<string> {
  const inventoryCol = collection(db, "inventory");

  const q = query(inventoryCol, where("model", "==", motorcycle.model));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const existingDoc = querySnapshot.docs[0];
    const existingData = existingDoc.data() as Motorcycle;
    const docRef = existingDoc.ref;

    const existingSkus = existingData.skus || [];
    const newSkusToAdd = motorcycle.skus.filter(sku => !existingSkus.includes(sku));

    const updatedSkus = [...existingSkus, ...newSkusToAdd];
    const updatedStock = updatedSkus.length;

    await setDoc(docRef, { stock: updatedStock, skus: updatedSkus }, { merge: true });
    return docRef.id;
  } else {
    const docRef = await addDoc(inventoryCol, motorcycle);
    return docRef.id;
  }
}

export async function updateMotorcycle(db: Firestore, motorcycleId: string, data: Partial<NewMotorcycle>): Promise<void> {
  const motorcycleRef = doc(db, "inventory", motorcycleId);
  await setDoc(motorcycleRef, data, { merge: true });
}

export async function deleteMotorcycle(db: Firestore, motorcycleId: string): Promise<void> {
  const motorcycleRef = doc(db, "inventory", motorcycleId);
  await deleteDoc(motorcycleRef);
}

export async function addMotorcyclesBatch(db: Firestore, motorcycles: NewMotorcycle[]): Promise<void> {
  const batch = writeBatch(db);
  const inventoryCol = collection(db, "inventory");

  for (const motorcycle of motorcycles) {
    const q = query(inventoryCol, where("model", "==", motorcycle.model));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      const docRef = doc(inventoryCol);
      batch.set(docRef, motorcycle);
    } else {
      const existingDoc = querySnapshot.docs[0];
      const existingData = existingDoc.data() as Motorcycle;
      const docRef = existingDoc.ref;

      const updatedStock = (existingData.stock || 0) + motorcycle.stock;
      const updatedSkus = [...(existingData.skus || []), ...motorcycle.skus];
      
      batch.update(docRef, { stock: updatedStock, skus: updatedSkus });
    }
  }

  await batch.commit();
}
