import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, Firestore } from "firebase/firestore";
import { SprintDoc, getSprintLabel, getCurrentSprintValue } from "@/lib/sprints";

export async function getSprints(db: Firestore): Promise<SprintDoc[]> {
  const col = collection(db, "sprints");
  const q = query(col);

  const snapshot = await getDocs(q);
  const sprints = snapshot.docs.map(d => d.data() as SprintDoc);

  // Sort descending by ID (YYYY-MM)
  sprints.sort((a, b) => b.id.localeCompare(a.id));

  return sprints;
}

export async function ensureCurrentSprint(db: Firestore): Promise<SprintDoc> {
   const currentId = getCurrentSprintValue();
   const docRef = doc(db, "sprints", currentId);
   const snapshot = await getDoc(docRef);

   if (snapshot.exists()) {
     return snapshot.data() as SprintDoc;
   }

   // Create it
   const newSprint: SprintDoc = {
     id: currentId,
     label: getSprintLabel(currentId),
     status: 'active',
     createdAt: new Date().toISOString()
   };

   await setDoc(docRef, newSprint);
   return newSprint;
}

export async function closeSprint(db: Firestore, sprintId: string): Promise<void> {
  const docRef = doc(db, "sprints", sprintId);
  await updateDoc(docRef, {
    status: 'closed',
    closedAt: new Date().toISOString()
  });
}
