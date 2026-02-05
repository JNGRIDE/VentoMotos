import { doc, getDoc, Firestore } from "firebase/firestore";

export async function getFinanciers(db: Firestore): Promise<string[]> {
  try {
    const ref = doc(db, "settings", "financiers");
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      const data = snapshot.data();
      return Array.isArray(data.list) ? data.list : ["Vento", "Maxicash", "Galgo", "Other"];
    }
  } catch (error) {
    console.warn("Failed to fetch financiers settings, using default.", error);
  }

  // Default fallback if document doesn't exist or error
  return ["Vento", "Maxicash", "Galgo", "Other"];
}
