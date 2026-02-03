import {
  collection,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import type { Prospect, UserProfile } from "@/lib/data";
import { fromFirestore } from "./utils";

export async function getProspects(db: Firestore, user: UserProfile): Promise<Prospect[]> {
    const prospectsCol = collection(db, "prospects");
    const q = user.role === 'Manager'
        ? query(prospectsCol)
        : query(prospectsCol, where("salespersonId", "==", user.uid));
        
    const prospectsSnapshot = await getDocs(q);
    const prospectsList = prospectsSnapshot.docs.map(doc => fromFirestore<Prospect>(doc));
    return prospectsList;
}
