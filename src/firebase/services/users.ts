import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  type Firestore,
} from "firebase/firestore";
import { type User } from "firebase/auth";
import type { NewUserProfile, UserProfile } from "@/lib/data";
import { fromFirestore } from "./utils";


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
