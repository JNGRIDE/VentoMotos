import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  runTransaction,
  serverTimestamp,
  type Firestore,
  writeBatch,
} from "firebase/firestore";
import type { Sale, NewSale, UserProfile, Motorcycle } from "@/lib/data";
import { fromFirestore } from "./utils";

/**
 * Fetches sales based on the user's role and the selected sprint.
 * Managers can see all sales, while other roles only see their own.
 */
export async function getSales(db: Firestore, profile: UserProfile, sprint: string): Promise<Sale[]> {
  let salesQuery = query(
    collection(db, "sales"), 
    where("sprint", "==", sprint), 
    orderBy("createdAt", "desc")
  );

  if (profile.role !== 'Manager') {
    salesQuery = query(
      collection(db, "sales"), 
      where("sprint", "==", sprint), 
      where("salespersonId", "==", profile.uid), 
      orderBy("createdAt", "desc")
    );
  }

  const snapshot = await getDocs(salesQuery);
  return snapshot.docs.map(doc => fromFirestore<Sale>(doc));
}

/**
 * Adds a new sale and adjusts the inventory in a single transaction.
 * If the sold item is in stock, its SKU is removed from the inventory.
 */
export async function addSale(db: Firestore, newSale: NewSale): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const saleRef = doc(collection(db, "sales"));
    const saleData = { ...newSale, createdAt: serverTimestamp() };
    
    // Only adjust inventory if a specific SKU was sold (not a special order)
    if (newSale.soldSku && newSale.motorcycleId) {
      const motorcycleRef = doc(db, "inventory", newSale.motorcycleId);
      const motorcycleDoc = await transaction.get(motorcycleRef);

      if (!motorcycleDoc.exists()) {
        throw new Error("Motorcycle for the sale not found in inventory.");
      }

      const motorcycleData = motorcycleDoc.data() as Motorcycle;
      const updatedSkus = (motorcycleData.skus || []).filter(sku => sku !== newSale.soldSku);

      if (motorcycleData.skus && updatedSkus.length === motorcycleData.skus.length) {
          // This indicates the SKU wasn't found, which is an inconsistency.
          throw new Error(`Sold SKU ${newSale.soldSku} not found in inventory for model ${motorcycleData.model}.`);
      }

      transaction.update(motorcycleRef, { 
        skus: updatedSkus, 
        stock: updatedSkus.length 
      });
    }
    
    transaction.set(saleRef, saleData);
  });
}

/**
 * Deletes a sale and adds the sold SKU back to the inventory in a transaction.
 */
export async function deleteSale(db: Firestore, sale: Sale): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const saleRef = doc(db, "sales", sale.id);

    // Only adjust inventory if a specific SKU was sold (not a special order)
    if (sale.soldSku && sale.motorcycleId) {
      const motorcycleRef = doc(db, "inventory", sale.motorcycleId);
      const motorcycleDoc = await transaction.get(motorcycleRef);

      if (motorcycleDoc.exists()) {
        const motorcycleData = motorcycleDoc.data() as Motorcycle;
        const skus = motorcycleData.skus || [];
        // Add SKU back if it's not already there to prevent duplicates
        if (!skus.includes(sale.soldSku)) {
          const updatedSkus = [...skus, sale.soldSku];
          transaction.update(motorcycleRef, {
            skus: updatedSkus,
            stock: updatedSkus.length,
          });
        }
      }
    }

    transaction.delete(saleRef);
  });
}

/**
 * Updates a sale and adjusts inventory for both the old and new motorcycle models
 * in a single, atomic transaction.
 */
export async function updateSaleAndAdjustInventory(
  db: Firestore,
  saleId: string,
  updatedSaleData: Partial<NewSale>,
  originalSale: Sale
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const saleRef = doc(db, "sales", saleId);

    const oldMotorcycleId = originalSale.motorcycleId;
    const oldSku = originalSale.soldSku;
    const newMotorcycleId = updatedSaleData.motorcycleId;
    const newSku = updatedSaleData.soldSku;

    const inventoryNeedsAdjustment = newMotorcycleId !== oldMotorcycleId || newSku !== oldSku;

    if (inventoryNeedsAdjustment) {
      // Step 1: Add the old SKU back to its motorcycle's inventory (if it existed)
      if (oldMotorcycleId && oldSku) {
        const oldMotoRef = doc(db, "inventory", oldMotorcycleId);
        const oldMotoDoc = await transaction.get(oldMotoRef);
        if (oldMotoDoc.exists()) {
          const oldMotoData = oldMotoDoc.data() as Motorcycle;
          const skus = oldMotoData.skus || [];
          if (!skus.includes(oldSku)) {
            const updatedSkus = [...skus, oldSku];
            transaction.update(oldMotoRef, { skus: updatedSkus, stock: updatedSkus.length });
          }
        }
      }

      // Step 2: Remove the new SKU from its motorcycle's inventory (if it exists)
      if (newMotorcycleId && newSku) {
        const newMotoRef = doc(db, "inventory", newMotorcycleId);
        const newMotoDoc = await transaction.get(newMotoRef);
        if (newMotoDoc.exists()) {
          const newMotoData = newMotoDoc.data() as Motorcycle;
          const updatedSkus = (newMotoData.skus || []).filter(s => s !== newSku);
          transaction.update(newMotoRef, { skus: updatedSkus, stock: updatedSkus.length });
        } else {
          throw new Error(`New motorcycle with ID ${newMotorcycleId} not found.`);
        }
      }
    }

    // Step 3: Update the sale document itself
    transaction.update(saleRef, updatedSaleData);
  });
}
