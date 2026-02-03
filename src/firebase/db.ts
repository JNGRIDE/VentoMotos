import {
  collection,
  getDocs,
  addDoc,
  Timestamp,
  query,
  orderBy,
  where,
  DocumentData,
  Firestore,
  doc,
  setDoc,
  getDoc,
  runTransaction,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { type User } from "firebase/auth";
import type { NewSale, Sale, Prospect, UserProfile, NewUserProfile, Motorcycle, NewMotorcycle } from "@/lib/data";

// A helper function to convert Firestore documents to our data types
function fromFirestore<T>(doc: DocumentData): T {
    const data = doc.data();
    // Convert Firestore Timestamps to ISO strings for dates
    Object.keys(data).forEach(key => {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
    });
    // The document ID is the user's UID in the 'users' collection
    if (doc.ref.parent.id === 'users') {
        return { uid: doc.id, ...data } as T;
    }
    return { id: doc.id, ...data } as T;
}

export async function createUserProfile(db: Firestore, user: User, name: string): Promise<void> {
  const userRef = doc(db, "users", user.uid);
  const newUserProfile: NewUserProfile = {
    name: name,
    email: user.email!,
    avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
    salesGoal: 0,
    creditsGoal: 0,
    role: "Salesperson" // Default role for new users
  };
  await setDoc(userRef, newUserProfile);
}

export async function getUserProfile(db: Firestore, uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return fromFirestore<UserProfile>(docSnap);
  }
  return null;
}


export async function getUserProfiles(db: Firestore): Promise<UserProfile[]> {
  const usersCol = collection(db, "users");
  const usersSnapshot = await getDocs(usersCol);
  const usersList = usersSnapshot.docs.map(doc => fromFirestore<UserProfile>(doc));
  return usersList;
}

export async function setUserProfile(db: Firestore, userProfile: Partial<UserProfile> & { uid: string }): Promise<void> {
  const userRef = doc(db, "users", userProfile.uid);
  const { uid, ...profileData } = userProfile;
  await setDoc(userRef, profileData, { merge: true });
}

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
    
    // If it's not a special order, deduct stock
    if (!sale.notes || sale.notes === "") {
        const currentStock = motorcycleDoc.data().stock;
        if (currentStock < 1) {
            // This is a server-side safeguard. The UI should prevent this.
            throw new Error(`No stock available for ${sale.motorcycleModel}. Sale cannot be completed.`);
        }
        const newStock = currentStock - 1;
        transaction.update(motorcycleRef, { stock: newStock });
    }

    // Create the new sale document (we need to generate a ref inside the transaction)
    const newSaleRef = doc(salesColRef);
    transaction.set(newSaleRef, {
      ...sale,
      date: new Date().toISOString(),
    });
  });
}


export async function getProspects(db: Firestore, user: UserProfile): Promise<Prospect[]> {
    const prospectsCol = collection(db, "prospects");
    const q = user.role === 'Manager'
        ? query(prospectsCol)
        : query(prospectsCol, where("salespersonId", "==", user.uid));
        
    const prospectsSnapshot = await getDocs(q);
    const prospectsList = prospectsSnapshot.docs.map(doc => fromFirestore<Prospect>(doc));
    return prospectsList;
}

// --- Inventory Functions ---
export async function getInventory(db: Firestore): Promise<Motorcycle[]> {
  const inventoryCol = collection(db, "inventory");
  const q = query(inventoryCol, orderBy("model"));
  const snapshot = await getDocs(q);
  const inventoryList = snapshot.docs.map(doc => fromFirestore<Motorcycle>(doc));
  return inventoryList;
}

export async function addMotorcycle(db: Firestore, motorcycle: NewMotorcycle): Promise<string> {
  const inventoryCol = collection(db, "inventory");
  const docRef = await addDoc(inventoryCol, motorcycle);
  return docRef.id;
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

  motorcycles.forEach(motorcycle => {
    const docRef = doc(inventoryCol); // Automatically generate a new document ID
    batch.set(docRef, motorcycle);
  });

  await batch.commit();
}
