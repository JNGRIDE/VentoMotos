import {
  collection,
  getDocs,
  query,
  where,
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  type Firestore,
} from "firebase/firestore";
import type { Sale, NewSale, UserProfile, Motorcycle } from "@/lib/data";
import { fromFirestore } from "./utils";

// Type assertion to include createdAt for sorting purposes
// as it's added dynamically but not in the base Sale type.
type SaleWithTimestamp = Sale & { createdAt?: Timestamp };

/**
 * Fetches sales for a sprint and sorts them in-memory.
 * This avoids the need for a composite index in Firestore.
 */
export async function getSales(db: Firestore, profile: UserProfile, sprint: string): Promise<Sale[]> {
  let salesQuery;

  // Base query fetches documents for the sprint.
  if (profile.role !== 'Manager') {
    // Salespeople see only their own sales.
    salesQuery = query(
      collection(db, "sales"),
      where("sprint", "==", sprint),
      where("salespersonId", "==", profile.uid)
    );
  } else {
    // Managers see all sales for the sprint.
    salesQuery = query(
      collection(db, "sales"),
      where("sprint", "==", sprint)
    );
  }

  const snapshot = await getDocs(salesQuery);
  const sales = snapshot.docs.map(doc => fromFirestore<SaleWithTimestamp>(doc));

  // Sort the results in-memory by creation date, descending.
  sales.sort((a, b) => {
    const timeA = a.createdAt?.toDate().getTime() || 0;
    const timeB = b.createdAt?.toDate().getTime() || 0;
    return timeB - timeA;
  });

  return sales;
}

/**
 * Adds a new sale and adjusts the inventory in a single transaction.
 * If the sold item is in stock, its SKU is removed from the inventory.
 */
export async function addSale(db: Firestore, newSale: NewSale): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const saleRef = doc(collection(db, "sales"));
    const saleData = { ...newSale, createdAt: serverTimestamp() };
    
    if (newSale.soldSku && newSale.motorcycleId) {
      const motorcycleRef = doc(db, "inventory", newSale.motorcycleId);
      const motorcycleDoc = await transaction.get(motorcycleRef);

      if (!motorcycleDoc.exists()) {
        throw new Error("Motorcycle for the sale not found in inventory.");
      }

      const motorcycleData = motorcycleDoc.data() as Motorcycle;
      const updatedSkus = (motorcycleData.skus || []).filter(sku => sku !== newSale.soldSku);

      if (motorcycleData.skus && updatedSkus.length === motorcycleData.skus.length) {
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

    if (sale.soldSku && sale.motorcycleId) {
      const motorcycleRef = doc(db, "inventory", sale.motorcycleId);
      const motorcycleDoc = await transaction.get(motorcycleRef);

      if (motorcycleDoc.exists()) {
        const motorcycleData = motorcycleDoc.data() as Motorcycle;
        const skus = motorcycleData.skus || [];
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
    transaction.update(saleRef, updatedSaleData);
  });
}
