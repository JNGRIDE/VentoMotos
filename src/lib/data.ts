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
  id: number;
  salespersonId: number;
  prospectName: string;
  amount: number;
  date: string;
  paymentMethod: "Cash" | "Financing";
  creditProvider?: "Vento" | "Other";
};

export type Prospect = {
  id: number;
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

export const sales: Sale[] = [
  { id: 1, salespersonId: 1, prospectName: "Juan Perez", amount: 25000, date: "2024-07-22", paymentMethod: "Cash" },
  { id: 2, salespersonId: 2, prospectName: "Maria Rodriguez", amount: 35000, date: "2024-07-21", paymentMethod: "Financing", creditProvider: "Vento" },
  { id: 3, salespersonId: 1, prospectName: "Luis Hernandez", amount: 42000, date: "2024-07-20", paymentMethod: "Financing", creditProvider: "Vento" },
  { id: 4, salespersonId: 3, prospectName: "Elena Torres", amount: 28000, date: "2024-07-19", paymentMethod: "Cash" },
  { id: 5, salespersonId: 2, prospectName: "David Garcia", amount: 50000, date: "2024-07-18", paymentMethod: "Financing", creditProvider: "Other" },
  { id: 6, salespersonId: 1, prospectName: "Laura Martinez", amount: 33000, date: "2024-07-17", paymentMethod: "Financing", creditProvider: "Vento" },
  { id: 7, salespersonId: 1, prospectName: "Test 1", amount: 33000, date: "2024-07-16", paymentMethod: "Financing", creditProvider: "Vento" },
  { id: 8, salespersonId: 1, prospectName: "Test 2", amount: 33000, date: "2024-07-15", paymentMethod: "Financing", creditProvider: "Vento" },
  { id: 9, salespersonId: 1, prospectName: "Test 3", amount: 33000, date: "2024-07-14", paymentMethod: "Financing", creditProvider: "Vento" },
];

export const prospects: Prospect[] = [
  { id: 1, name: "Roberto Jimenez", stage: "Potential", source: "Advertising", salespersonId: 1, lastContact: "2024-07-22" },
  { id: 2, name: "Patricia Morales", stage: "Appointment", source: "Organic", salespersonId: 2, lastContact: "2024-07-21" },
  { id: 3, name: "Fernando Castillo", stage: "Credit", source: "Advertising", salespersonId: 1, lastContact: "2024-07-20" },
  { id: 4, name: "Gabriela Rios", stage: "Potential", source: "Organic", salespersonId: 3, lastContact: "2024-07-19" },
  { id: 5, name: "Ricardo Nava", stage: "Appointment", source: "Advertising", salespersonId: 2, lastContact: "2024-07-18" },
  { id: 6, name: "Isabel Romero", stage: "Closed", source: "Organic", salespersonId: 1, lastContact: "2024-07-17" },
  { id: 7, name: "Jorge Salazar", stage: "Potential", source: "Advertising", salespersonId: 3, lastContact: "2024-07-22" },
  { id: 8, name: "Monica Vega", stage: "Credit", source: "Organic", salespersonId: 2, lastContact: "2024-07-21" },
];

export const getSalesBySalesperson = (id: number) => sales.filter(s => s.salespersonId === id);
export const getProspectsBySalesperson = (id: number) => prospects.filter(p => p.salespersonId === id);
