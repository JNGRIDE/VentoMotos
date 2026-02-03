import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  runTransaction,
  doc,
  type Firestore,
} from "firebase/firestore";
import type { NewSale, Sale, UserProfile } from "@/lib/data";
import { fromFirestore } from "./utils";

export async function getSales(db: Firestore, user: UserProfile): Promise<Sale[]> {
  const salesCol = collection(db, "sales");
  const q = user.role === 'Manager'
    ? query(salesCol, orderBy("date", "desc"))
    : query(salesCol, where("salespersonId", "==", user.uid), orderBy("date", "desc"));
    
  const salesSnapshot = await getDocs(q);
  const salesList = salesSnapshot.docs.map(doc => fromFirestore<Sale>(doc));
  return salesList;
}

// Transactional sale creation with inventory deduction
export async function addSale(db: Firestore, sale: NewSale): Promise<void> {
  const motorcycleRef = doc(db, "inventory", sale.motorcycleId);
  const salesColRef = collection(db, "sales");

  await runTransaction(db, async (transaction) => {
    const motorcycleDoc = await transaction.get(motorcycleRef);
    if (!motorcycleDoc.exists()) {
      throw new Error("Motorcycle does not exist in inventory!");
    }
    
    // If it's not a special order, deduct stock and remove the specific SKU
    if (!sale.notes || sale.notes === "") {
        const data = motorcycleDoc.data();
        const currentStock = data.stock;
        const currentSkus = data.skus || [];

        if (currentStock < 1) {
            // This is a server-side safeguard. The UI should prevent this.
            throw new Error(`No stock available for ${sale.motorcycleModel}. Sale cannot be completed.`);
        }
        
        const newStock = currentStock - 1;
        const newSkus = currentSkus.filter((s: string) => s !== sale.soldSku);

        if (currentSkus.length === newSkus.length && sale.soldSku) {
          // This can happen if the SKU was already sold by someone else in a concurrent transaction
          // Only throw if an SKU was expected to be sold.
          throw new Error(`SKU ${sale.soldSku} for model ${sale.motorcycleModel} was not found or already sold.`);
        }

        transaction.update(motorcycleRef, { stock: newStock, skus: newSkus });
    }

    // Create the new sale document (we need to generate a ref inside the transaction)
    const newSaleRef = doc(salesColRef);
    transaction.set(newSaleRef, {
      ...sale,
      date: new Date().toISOString(),
    });
  });
}
