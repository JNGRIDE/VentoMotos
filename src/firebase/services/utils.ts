import { DocumentData, Timestamp } from "firebase/firestore";

// A helper function to convert Firestore documents to our data types
export function fromFirestore<T>(doc: DocumentData): T {
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
