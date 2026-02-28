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

/**
 * Adds a single motorcycle to the inventory, ensuring no duplicate SKUs are added.
 * It checks for SKUs across the entire inventory.
 * 
 * @param db The Firestore instance.
 * @param motorcycle The new motorcycle to add.
 */
export async function addMotorcycle(db: Firestore, motorcycle: NewMotorcycle): Promise<void> {
  const inventoryCol = collection(db, "inventory");

  const inventorySnapshot = await getDocs(inventoryCol);
  const existingInventory = inventorySnapshot.docs.map(doc => fromFirestore<Motorcycle>(doc));

  const existingSkus = new Set<string>();
  existingInventory.forEach(item => {
    if (item.skus) {
      item.skus.forEach(sku => existingSkus.add(sku));
    }
  });

  const uniqueNewSkus = motorcycle.skus.filter(sku => !existingSkus.has(sku));

  if (uniqueNewSkus.length === 0) {
    throw new Error("All SKUs provided already exist in the inventory.");
  }

  const existingModel = existingInventory.find(item => item.model === motorcycle.model);

  if (existingModel) {
    const docRef = doc(db, "inventory", existingModel.id);
    const updatedSkus = [...(existingModel.skus || []), ...uniqueNewSkus];
    await setDoc(docRef, { stock: updatedSkus.length, skus: updatedSkus }, { merge: true });
  } else {
    const newDocData: NewMotorcycle = {
        model: motorcycle.model,
        skus: uniqueNewSkus,
        stock: uniqueNewSkus.length
    };
    await addDoc(inventoryCol, newDocData);
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

/**
 * Securely updates the inventory in a batch. 
 * It prevents SKU duplication by checking against all existing SKUs in the database.
 * - If a SKU from the input already exists, it's ignored.
 * - If a model exists, new unique SKUs are added to it.
 * - If a model is new, it is created with its SKUs.
 * 
 * @param db The Firestore instance.
 * @param motorcycles An array of NewMotorcycle objects from the parsed CSV.
 */
export async function addMotorcyclesBatch(db: Firestore, motorcycles: NewMotorcycle[]): Promise<void> {
  const batch = writeBatch(db);
  const inventoryCol = collection(db, "inventory");

  // 1. Get all existing inventory to check against.
  const inventorySnapshot = await getDocs(inventoryCol);
  const existingInventory = inventorySnapshot.docs.map(doc => fromFirestore<Motorcycle>(doc));

  // 2. Create a Set of all existing SKUs for efficient O(1) lookup.
  const existingSkus = new Set<string>();
  existingInventory.forEach(item => {
    if (item.skus) {
      item.skus.forEach(sku => existingSkus.add(sku));
    }
  });

  // 3. Create a Map for existing models for quick access to their data and doc ID.
  const modelMap = new Map<string, { id: string, skus: string[] }>();
  existingInventory.forEach(item => {
    modelMap.set(item.model, { id: item.id, skus: item.skus || [] });
  });

  // This will hold motorcycles grouped by model from the user's upload
  const newMotorcyclesByModel = new Map<string, { skus: string[] }>();

  // Group user-provided motorcycles by model and collect all their unique SKUs
  for (const motorcycle of motorcycles) {
    if (!newMotorcyclesByModel.has(motorcycle.model)) {
      newMotorcyclesByModel.set(motorcycle.model, { skus: [] });
    }
    const modelEntry = newMotorcyclesByModel.get(motorcycle.model)!;
    
    // Filter out SKUs that already exist in the database or in the current upload batch
    const uniqueNewSkus = motorcycle.skus.filter(sku => !existingSkus.has(sku));

    if (uniqueNewSkus.length > 0) {
      modelEntry.skus.push(...uniqueNewSkus);
      // Add the new unique SKUs to the global set to handle duplicates within the uploaded file itself
      uniqueNewSkus.forEach(sku => existingSkus.add(sku));
    }
  }

  // 4. Iterate over the grouped new motorcycles and prepare the batch write
  for (const [model, data] of newMotorcyclesByModel.entries()) {
    if (data.skus.length === 0) {
        // Skip if there are no new unique SKUs to add for this model
        continue;
    }

    const existingModel = modelMap.get(model);

    if (existingModel) {
      // 5a. If model exists, prepare an UPDATE operation
      const docRef = doc(db, "inventory", existingModel.id);
      const updatedSkus = [...existingModel.skus, ...data.skus];
      const updatedStock = updatedSkus.length;
      batch.update(docRef, { stock: updatedStock, skus: updatedSkus });
    } else {
      // 5b. If model is new, prepare a SET operation
      const docRef = doc(inventoryCol);
      const newStock = data.skus.length;
      const newMotorcycle: NewMotorcycle = {
          model: model,
          stock: newStock,
          skus: data.skus,
      };
      batch.set(docRef, newMotorcycle);
    }
  }

  // 6. Commit the batch
  await batch.commit();
}
