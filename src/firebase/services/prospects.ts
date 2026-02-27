import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  type Firestore,
} from "firebase/firestore";
import type { Prospect, UserProfile, NewProspect } from "@/lib/data";
import { fromFirestore } from "./utils";

/**
 * Mapea etapas antiguas en inglés a las nuevas en español para mantener compatibilidad
 * con datos existentes en la base de datos.
 */
function normalizeProspectStage(stage: string): Prospect["stage"] {
  const mapping: Record<string, Prospect["stage"]> = {
    "Potential": "Potencial",
    "Scheduled": "Agendado",
    "Interested": "Potencial",
    "Negotiating": "Agendado",
    "Closed": "Cerrado",
    // Agregamos las nuevas por si acaso
    "Potencial": "Potencial",
    "Agendado": "Agendado",
    "Crédito Aprobado": "Crédito Aprobado",
    "Caído": "Caído",
    "Cerrado": "Cerrado"
  };

  return mapping[stage] || "Potencial";
}

export async function getProspects(db: Firestore, user: UserProfile, sprint: string): Promise<Prospect[]> {
    const prospectsCol = collection(db, "prospects");
    
    const constraints = [where("sprint", "==", sprint)];
    if (user.role !== 'Manager') {
        constraints.push(where("salespersonId", "==", user.uid));
    }
        
    const q = query(prospectsCol, ...constraints);
    
    const prospectsSnapshot = await getDocs(q);
    const prospectsList = prospectsSnapshot.docs.map(doc => {
        const data = fromFirestore<Prospect>(doc);
        // Normalizamos la etapa para que aparezca en el Kanban actual
        return {
            ...data,
            stage: normalizeProspectStage(data.stage)
        };
    });
    
    prospectsList.sort((a, b) => new Date(b.lastContact).getTime() - new Date(a.lastContact).getTime());
    return prospectsList;
}

export async function addProspect(db: Firestore, prospect: NewProspect): Promise<string> {
    const prospectsCol = collection(db, "prospects");
    const docRef = await addDoc(prospectsCol, prospect);
    return docRef.id;
}

export async function updateProspect(db: Firestore, prospectId: string, updates: Partial<Prospect>): Promise<void> {
    const prospectRef = doc(db, "prospects", prospectId);
    await updateDoc(prospectRef, updates);
}

export async function deleteProspect(db: Firestore, prospectId: string): Promise<void> {
    const prospectRef = doc(db, "prospects", prospectId);
    await deleteDoc(prospectRef);
}
