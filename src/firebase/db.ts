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
} from "firebase/firestore";
import { type User } from "firebase/auth";
import type { NewSale, Sale, Prospect, UserProfile, NewUserProfile } from "@/lib/data";

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

export async function addSale(db: Firestore, sale: NewSale): Promise<void> {
  const salesCol = collection(db, "sales");
  await addDoc(salesCol, {
      ...sale,
      date: new Date().toISOString(),
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