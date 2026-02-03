import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  runTransaction,
  doc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import type { NewSale, Sale, UserProfile } from "@/lib/data";
import { fromFirestore } from "./utils";

export async function getSales(db: Firestore, user: UserProfile, sprint: string): Promise<Sale[]> {
  const salesCol = collection(db, "sales");
  
  const constraints = [where("sprint", "==", sprint)];
  if (user.role !== 'Manager') {
    constraints.push(where("salespersonId", "==", user.uid));
  }
  
  const q = query(salesCol, ...constraints, orderBy("date", "desc"));
    
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
    
    if (!sale.notes || sale.notes === "") {
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

  await batch.commit();
}
