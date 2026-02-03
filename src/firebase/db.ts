import {
  collection,
  getDocs,
  addDoc,
  Timestamp,
  query,
  orderBy,
  DocumentData,
  Firestore,
  doc,
  setDoc,
} from "firebase/firestore";
import type { NewSale, Sale, Prospect, Salesperson } from "@/lib/data";

// A helper function to convert Firestore documents to our data types
function fromFirestore<T>(doc: DocumentData): T {
    const data = doc.data();
    // Convert Firestore Timestamps to ISO strings for dates
    Object.keys(data).forEach(key => {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
    });
    // The document ID is the salesperson's UID in the 'users' collection
    if (doc.ref.parent.id === 'users') {
        return { uid: doc.id, ...data } as T;
    }
    return { id: doc.id, ...data } as T;
}

export async function getSalespeople(db: Firestore): Promise<Salesperson[]> {
  const salespeopleCol = collection(db, "users");
  const salespeopleSnapshot = await getDocs(salespeopleCol);
  // Assuming 'users' collection documents have fields matching the Salesperson type
  const salespeopleList = salespeopleSnapshot.docs.map(doc => fromFirestore<Salesperson>(doc));
  return salespeopleList;
}

export async function setSalesperson(db: Firestore, salesperson: Salesperson): Promise<void> {
  const userRef = doc(db, "users", salesperson.uid);
  const { uid, ...salespersonData } = salesperson; // Remove uid from the object to be saved
  await setDoc(userRef, salespersonData, { merge: true });
}

export async function getSales(db: Firestore): Promise<Sale[]> {
  const salesCol = collection(db, "sales");
  const q = query(salesCol, orderBy("date", "desc"));
  const salesSnapshot = await getDocs(q);
  const salesList = salesSnapshot.docs.map(doc => fromFirestore<Sale>(doc));
  return salesList;
}

export async function addSale(db: Firestore, sale: NewSale): Promise<void> {
  const salesCol = collection(db, "sales");
  await addDoc(salesCol, {
      ...sale,
      date: new Date().toISOString(),
  });
}

export async function getProspects(db: Firestore): Promise<Prospect[]> {
    const prospectsCol = collection(db, "prospects");
    const prospectsSnapshot = await getDocs(prospectsCol);
    const prospectsList = prospectsSnapshot.docs.map(doc => fromFirestore<Prospect>(doc));
    return prospectsList;
}
