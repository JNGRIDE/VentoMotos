import {
  type Firestore,
  doc,
  runTransaction,
  collection,
  getDocs,
} from "firebase/firestore";
import type { Sale, NewSale, Motorcycle } from "@/lib/data";
import { fromFirestore } from "./utils";

/**
 * Updates a sale and adjusts inventory within a single transaction.
 * This ensures data consistency between sales and inventory records.
 *
 * @param db The Firestore instance.
 * @param saleId The ID of the sale to update.
 * @param updatedSaleData The new data for the sale.
 * @param originalSale The original sale object before modification.
 */
export async function updateSaleAndAdjustInventory(
  db: Firestore,
  saleId: string,
  updatedSaleData: Partial<NewSale>,
  originalSale: Sale
): Promise<void> {
  
  await runTransaction(db, async (transaction) => {
    const saleRef = doc(db, "sales", saleId);
    const inventoryCol = collection(db, "inventory");

    const oldMotorcycleId = originalSale.motorcycleId;
    const oldSku = originalSale.soldSku;
    const newMotorcycleId = updatedSaleData.motorcycleId;
    const newSku = updatedSaleData.soldSku;

    const inventoryNeedsAdjustment = newMotorcycleId !== oldMotorcycleId || newSku !== oldSku;

    if (inventoryNeedsAdjustment) {
        // 1. Add the old SKU back to its motorcycle's inventory
        if (oldMotorcycleId && oldSku) {
            const oldMotoRef = doc(db, "inventory", oldMotorcycleId);
            const oldMotoDoc = await transaction.get(oldMotoRef);

            if (oldMotoDoc.exists()) {
                const oldMotoData = oldMotoDoc.data() as Motorcycle;
                const skus = oldMotoData.skus || [];
                if (!skus.includes(oldSku)) { // Add it back if it's not there
                    const updatedSkus = [...skus, oldSku];
                    transaction.update(oldMotoRef, { 
                        skus: updatedSkus,
                        stock: updatedSkus.length,
                    });
                }
            }
        }

        // 2. Remove the new SKU from its motorcycle's inventory
        if (newMotorcycleId && newSku) {
            const newMotoRef = doc(db, "inventory", newMotorcycleId);
            const newMotoDoc = await transaction.get(newMotoRef);

            if (newMotoDoc.exists()) {
                const newMotoData = newMotoDoc.data() as Motorcycle;
                const updatedSkus = (newMotoData.skus || []).filter(s => s !== newSku);
                transaction.update(newMotoRef, { 
                    skus: updatedSkus, 
                    stock: updatedSkus.length 
                });
            } else {
                throw new Error(`Motorcycle with ID ${newMotorcycleId} not found in inventory.`);
            }
        }
    }

    // 3. Finally, update the sale document itself
    transaction.update(saleRef, updatedSaleData);
  });
}
