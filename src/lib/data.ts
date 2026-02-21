export type UserProfile = {
  uid: string; // Corresponds to Firebase Auth UID
  name: string;
  email: string;
  avatarUrl: string;
  salesGoal: number;
  creditsGoal: number;
  role: "Manager" | "Salesperson";
};

// For creating a new profile document in Firestore
export type NewUserProfile = Omit<UserProfile, "uid">;

export type Motorcycle = {
  id: string; // Firestore document ID
  model: string;
  stock: number;
  skus: string[];
};

export type NewMotorcycle = Omit<Motorcycle, "id">;

export type Sale = {
  id: string; // Firestore document ID
  sprint: string; // e.g., "2024-07"
  salespersonId: string; // This is now the salesperson's UID
  prospectName:string;
  amount: number;
  motorcycleId: string; // Link to the inventory item
  motorcycleModel: string; // Denormalized for easy display
  soldSku: string; // The specific SKU that was sold
  date: string;
  paymentMethod: "Cash" | "Financing";
  creditProvider?: string; // "Vento", "Maxicash", "Galgo", etc.
  notes?: string; // For special orders, e.g. "Sobre pedido (CEDIS)"
};

// NewSale will be used in the form. Note `notes` is optional
export type NewSale = Omit<Sale, "id" | "date">;

export type Prospect = {
  id: string; // Firestore document ID
  sprint: string; // e.g., "2024-07"
  name: string;
  stage: "Potential" | "Appointment" | "Credit" | "Closed";
  source: "Organic" | "Advertising";
  salespersonId: string; // This is now the salesperson's UID
  lastContact: string;

  // New fields
  phone?: string;
  email?: string;
  rfc?: string;
  address?: string;
  notes?: string;

  // Enriched fields
  occupation?: string;
  motorcycleInterest?: string;
  stageUpdatedAt?: string;
  notesList?: { content: string; date: string; author?: string }[];
};

export const PROSPECT_STAGES: Prospect["stage"][] = ["Potential", "Appointment", "Credit", "Closed"];

export type NewProspect = Omit<Prospect, "id">;

// This function will be used by components to filter data already fetched from Firestore.
export const getSalesByUser = (uid: string, salesList: Sale[]) => salesList.filter(s => s.salespersonId === uid);
export const getProspectsByUser = (uid: string, prospectsList: Prospect[]) => prospectsList.filter(p => p.salespersonId === uid);

export function areProspectsVisualEqual(p1: Prospect, p2: Prospect): boolean {
  if (p1 === p2) return true;
  return (
    p1.id === p2.id &&
    p1.name === p2.name &&
    p1.stage === p2.stage &&
    p1.source === p2.source &&
    p1.salespersonId === p2.salespersonId &&
    p1.lastContact === p2.lastContact &&
    p1.phone === p2.phone &&
    p1.email === p2.email &&
    p1.stageUpdatedAt === p2.stageUpdatedAt
  );
}
