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
  writeBatch,
} from "firebase/firestore";
import type { Sale, NewSale, UserProfile, Motorcycle } from "@/lib/data";
import { fromFirestore } from "./utils";

// Type assertion for sorting, as createdAt is added on the server.
type SaleWithTimestamp = Sale & { createdAt?: Timestamp };

/**
 * Fetches sales for a specific sprint, respecting user roles.
 * Sorts them in-memory to avoid composite indexes.
 */
export async function getSales(db: Firestore, profile: UserProfile, sprint: string): Promise<Sale[]> {
  let salesQuery;
  if (profile.role !== 'Manager') {
    salesQuery = query(
      collection(db, "sales"),
      where("sprint", "==", sprint),
      where("salespersonId", "==", profile.uid)
    );
  } else {
    salesQuery = query(collection(db, "sales"), where("sprint", "==", sprint));
  }

  const snapshot = await getDocs(salesQuery);
  const sales = snapshot.docs.map(doc => fromFirestore<SaleWithTimestamp>(doc));

  // Sort in-memory to prevent index errors
  sales.sort((a, b) => (b.createdAt?.toDate().getTime() || 0) - (a.createdAt?.toDate().getTime() || 0));

  return sales;
}

/**
 * Fetches all sales across all sprints, for manager use.
 * Sorts them in-memory to avoid needing a global index.
 */
export async function getAllSales(db: Firestore): Promise<Sale[]> {
  const salesQuery = query(collection(db, "sales"));
  const snapshot = await getDocs(salesQuery);
  const sales = snapshot.docs.map(doc => fromFirestore<SaleWithTimestamp>(doc));

  // Sort in-memory to prevent index errors
  sales.sort((a, b) => (b.createdAt?.toDate().getTime() || 0) - (a.createdAt?.toDate().getTime() || 0));

  return sales;
}


/**
 * Adds a new sale and adjusts the inventory in a single transaction.
 * All reads must be performed before any writes.
 */
export async function addSale(db: Firestore, newSale: NewSale): Promise<void> {
  const saleRef = doc(collection(db, "sales"));
  const motorcycleRef = newSale.motorcycleId ? doc(db, "inventory", newSale.motorcycleId) : null;

  await runTransaction(db, async (transaction) => {
    // 1. READ PHASE: Read all necessary documents first.
    const motorcycleDoc = motorcycleRef ? await transaction.get(motorcycleRef) : null;

    // 2. WRITE PHASE: Perform all writes after reads are complete.
    if (motorcycleRef && newSale.soldSku) {
      if (!motorcycleDoc?.exists()) {
        throw new Error("Motorcycle not found in inventory.");
      }
      const motorcycleData = motorcycleDoc.data() as Motorcycle;
      const updatedSkus = (motorcycleData.skus || []).filter(sku => sku !== newSale.soldSku);

      if (motorcycleData.skus && updatedSkus.length === motorcycleData.skus.length) {
          throw new Error(`Sold SKU ${newSale.soldSku} not found for model ${motorcycleData.model}.`);
      }
      // Write the inventory update
      transaction.update(motorcycleRef, { skus: updatedSkus, stock: updatedSkus.length });
    }
    
    // Write the new sale document
    transaction.set(saleRef, { ...newSale, createdAt: serverTimestamp() });
  });
}

/**
 * Deletes a sale and restocks the sold SKU in a transaction.
 */
export async function deleteSale(db: Firestore, sale: Sale): Promise<void> {
  const saleRef = doc(db, "sales", sale.id);
  const motorcycleRef = sale.motorcycleId ? doc(db, "inventory", sale.motorcycleId) : null;

  await runTransaction(db, async (transaction) => {
    // 1. READ PHASE
    const motorcycleDoc = motorcycleRef && sale.soldSku ? await transaction.get(motorcycleRef) : null;

    // 2. WRITE PHASE
    if (motorcycleDoc && motorcycleDoc.exists()) {
        const motorcycleData = motorcycleDoc.data() as Motorcycle;
        const skus = motorcycleData.skus || [];
        if (!skus.includes(sale.soldSku!)) {
          const updatedSkus = [...skus, sale.soldSku!];
          transaction.update(motorcycleRef!, { skus: updatedSkus, stock: updatedSkus.length });
        }
    }

    transaction.delete(saleRef);
  });
}

/**
 * Updates a sale and adjusts inventory for old and new models in a transaction.
 */
export async function updateSaleAndAdjustInventory(
  db: Firestore,
  saleId: string,
  updatedSaleData: Partial<NewSale>,
  originalSale: Sale
): Promise<void> {
  const saleRef = doc(db, "sales", saleId);

  await runTransaction(db, async (transaction) => {
    // 1. READ PHASE
    const oldMotoRef = originalSale.motorcycleId && originalSale.soldSku ? doc(db, "inventory", originalSale.motorcycleId) : null;
    const newMotoRef = updatedSaleData.motorcycleId && updatedSaleData.soldSku ? doc(db, "inventory", updatedSaleData.motorcycleId) : null;

    const oldMotoDoc = oldMotoRef ? await transaction.get(oldMotoRef) : null;
    const newMotoDoc = newMotoRef ? await transaction.get(newMotoRef) : null;

    // 2. WRITE PHASE
    const inventoryNeedsAdjustment = updatedSaleData.motorcycleId !== originalSale.motorcycleId || updatedSaleData.soldSku !== originalSale.soldSku;

    if (inventoryNeedsAdjustment) {
      // Restock old item
      if (oldMotoDoc && oldMotoDoc.exists()) {
        const oldMotoData = oldMotoDoc.data() as Motorcycle;
        if (!oldMotoData.skus.includes(originalSale.soldSku!)) {
          const updatedSkus = [...oldMotoData.skus, originalSale.soldSku!];
          transaction.update(oldMotoRef!, { skus: updatedSkus, stock: updatedSkus.length });
        }
      }

      // Destock new item
      if (newMotoDoc && newMotoDoc.exists()) {
        const newMotoData = newMotoDoc.data() as Motorcycle;
        const updatedSkus = (newMotoData.skus || []).filter(s => s !== updatedSaleData.soldSku);
        transaction.update(newMotoRef!, { skus: updatedSkus, stock: updatedSkus.length });
      } else if (newMotoRef) {
        throw new Error(`New motorcycle with ID ${updatedSaleData.motorcycleId} not found.`);
      }
    }
    
    transaction.update(saleRef, updatedSaleData);
  });
}

/**
 * Updates multiple sale documents in a single batch.
 */
export async function batchUpdateSales(db: Firestore, updates: { id: string; amount: number }[]): Promise<void> {
  const batch = writeBatch(db);
  updates.forEach(update => {
    const saleRef = doc(db, "sales", update.id);
    batch.update(saleRef, { amount: update.amount });
  });
  await batch.commit();
}
