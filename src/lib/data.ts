import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';

const userAvatars: ImagePlaceholder[] = PlaceHolderImages.filter(img => img.imageHint.includes('person'));

export type Salesperson = {
  id: number;
  name: string;
  avatarUrl: string;
  salesGoal: number;
  creditsGoal: number;
};

export type Sale = {
  id: string; // Firestore document ID
  salespersonId: number;
  prospectName:string;
  amount: number;
  date: string;
  paymentMethod: "Cash" | "Financing";
  creditProvider?: "Vento" | "Other";
};

export type NewSale = Omit<Sale, "id" | "date">;

export type Prospect = {
  id: string; // Firestore document ID
  name: string;
  stage: "Potential" | "Appointment" | "Credit" | "Closed";
  source: "Organic" | "Advertising";
  salespersonId: number;
  lastContact: string;
};

export const salespeople: Salesperson[] = [
  { id: 1, name: "Ana Gomez", avatarUrl: userAvatars[0]?.imageUrl || 'https://picsum.photos/seed/101/100/100', salesGoal: 150000, creditsGoal: 10 },
  { id: 2, name: "Carlos Diaz", avatarUrl: userAvatars[1]?.imageUrl || 'https://picsum.photos/seed/102/100/100', salesGoal: 120000, creditsGoal: 8 },
  { id: 3, name: "Sofia Chen", avatarUrl: userAvatars[2]?.imageUrl || 'https://picsum.photos/seed/103/100/100', salesGoal: 135000, creditsGoal: 9 },
];

// Mock data has been removed and will be managed in Firestore.
export const sales: Sale[] = [];
export const prospects: Prospect[] = [];

// This function will be used by components to filter data fetched from Firestore.
export const getSalesBySalesperson = (id: number, salesList: Sale[]) => salesList.filter(s => s.salespersonId === id);
export const getProspectsBySalesperson = (id: number, prospectsList: Prospect[]) => prospectsList.filter(p => p.salespersonId === id);
