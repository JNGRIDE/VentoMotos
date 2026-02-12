import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  runTransaction,
  doc,
  writeBatch,
  deleteDoc,
  setDoc,
  type Firestore,
} from "firebase/firestore";
import type { NewSale, Sale, UserProfile } from "@/lib/data";
import { fromFirestore } from "./utils";

export async function getSales(db: Firestore, user: UserProfile, sprint: string): Promise<Sale[]> {
  const salesCol = collection(db, "sales");
  
  const constraints = [
    where("sprint", "==", sprint)
  ];

  if (user.role !== 'Manager') {
    constraints.push(where("salespersonId", "==", user.uid));
  }

  const q = query(salesCol, ...constraints);
    
  const salesSnapshot = await getDocs(q);
  const salesList = salesSnapshot.docs.map(doc => fromFirestore<Sale>(doc));

  // Sort here on the client side
  salesList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
    
    if (sale.soldSku) {
        const data = motorcycleDoc.data();
        const currentStock = data.stock;
        const currentSkus = data.skus || [];

        if (currentStock < 1) {
            throw new Error(`No stock available for ${sale.motorcycleModel}. Sale cannot be completed.`);
        }
        
        const newStock = currentStock - 1;
        const newSkus = currentSkus.filter((s: string) => s !== sale.soldSku);

        if (currentSkus.length === newSkus.length && sale.soldSku) {
          throw new Error(`SKU ${sale.soldSku} for model ${sale.motorcycleModel} was not found or already sold.`);
        }

        transaction.update(motorcycleRef, { stock: newStock, skus: newSkus });
    }

    const newSaleRef = doc(salesColRef);
    transaction.set(newSaleRef, {
      ...sale,
      date: new Date().toISOString(),
    });
  });
}

// Transactional sale deletion with inventory restoration
export async function deleteSale(db: Firestore, sale: Sale): Promise<void> {
  const saleRef = doc(db, "sales", sale.id);

  // If soldSku exists, it means inventory was deducted, so we must restore it.
  if (sale.soldSku) {
    const motorcycleRef = doc(db, "inventory", sale.motorcycleId);

    await runTransaction(db, async (transaction) => {
        const motorcycleDoc = await transaction.get(motorcycleRef);
        // If motorcycle doesn't exist anymore, we just delete the sale.
        if (motorcycleDoc.exists()) {
             const data = motorcycleDoc.data();
             const currentStock = data.stock || 0;
             const currentSkus = data.skus || [];

             // Add the SKU back if it was recorded
             let newSkus = [...currentSkus];
             if (sale.soldSku) {
                 newSkus.push(sale.soldSku);
             }

             transaction.update(motorcycleRef, {
                 stock: currentStock + 1,
                 skus: newSkus
             });
        }
        transaction.delete(saleRef);
    });
  } else {
      // Just delete the sale if it was a special order (no inventory impact)
      await deleteDoc(saleRef);
  }
}

// Transactional sale update
export async function updateSale(db: Firestore, saleId: string, oldSale: Sale, newSale: NewSale): Promise<void> {
    const saleRef = doc(db, "sales", saleId);

    // Check if inventory needs to be touched
    const inventoryChanged =
        oldSale.motorcycleId !== newSale.motorcycleId ||
        oldSale.soldSku !== newSale.soldSku;

    if (!inventoryChanged) {
        // Just update metadata
        // Preserve original date
        await setDoc(saleRef, { ...newSale, date: oldSale.date }, { merge: true });
        return;
    }

    const oldMotoRef = doc(db, "inventory", oldSale.motorcycleId);
    const newMotoRef = doc(db, "inventory", newSale.motorcycleId);

    await runTransaction(db, async (transaction) => {
        let oldMotoDoc = null;
        let newMotoDoc = null;

        // READ PHASE
        if (oldSale.soldSku) {
            oldMotoDoc = await transaction.get(oldMotoRef);
        }

        if (newSale.soldSku) {
            if (oldSale.motorcycleId === newSale.motorcycleId && oldSale.soldSku) {
                newMotoDoc = oldMotoDoc;
            } else {
                newMotoDoc = await transaction.get(newMotoRef);
            }
        }

        // LOGIC PHASE
        const updates = new Map<string, { stock: number, skus: string[] }>();

        const getPendingState = (id: string, docSnap: any) => {
             if (updates.has(id)) return updates.get(id)!;
             // Clone arrays to avoid mutation issues
             return { stock: docSnap.data().stock, skus: [...(docSnap.data().skus || [])] };
        }

        // 1. Restore Old Inventory
        if (oldSale.soldSku && oldMotoDoc && oldMotoDoc.exists()) {
             const state = getPendingState(oldSale.motorcycleId, oldMotoDoc);
             state.stock++;
             state.skus.push(oldSale.soldSku);
             updates.set(oldSale.motorcycleId, state);
        }

        // 2. Deduct New Inventory
        if (newSale.soldSku && newMotoDoc && newMotoDoc.exists()) {
             const state = getPendingState(newSale.motorcycleId, newMotoDoc);

             if (state.stock < 1) throw new Error(`No stock available for ${newSale.motorcycleModel}`);

             state.stock--;
             state.skus = state.skus.filter((s: string) => s !== newSale.soldSku);
             updates.set(newSale.motorcycleId, state);
        }

        // WRITE PHASE
        updates.forEach((data, id) => {
            const ref = doc(db, "inventory", id);
            transaction.update(ref, data);
        });

        transaction.update(saleRef, { ...newSale, date: oldSale.date });
    });
}


export async function resetSprintData(db: Firestore, sprint: string): Promise<void> {
  const batch = writeBatch(db);

  // 1. Delete Sales for the sprint
  const salesQuery = query(collection(db, "sales"), where("sprint", "==", sprint));
  const salesSnapshot = await getDocs(salesQuery);
  salesSnapshot.forEach(doc => {
    batch.delete(doc.ref);
  });

  // 2. Delete Prospects for the sprint
  const prospectsQuery = query(collection(db, "prospects"), where("sprint", "==", sprint));
  const prospectsSnapshot = await getDocs(prospectsQuery);
  prospectsSnapshot.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  // 3. Reset goals for all salespeople
  const usersQuery = query(collection(db, "users"), where("role", "==", "Salesperson"));
  const usersSnapshot = await getDocs(usersQuery);
  usersSnapshot.forEach(userDoc => {
    batch.update(userDoc.ref, { salesGoal: 0, creditsGoal: 0 });
  });

  // 4. Delete all inventory
  const inventoryQuery = query(collection(db, "inventory"));
  const inventorySnapshot = await getDocs(inventoryQuery);
  inventorySnapshot.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}
