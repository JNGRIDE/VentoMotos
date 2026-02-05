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
};

export type NewProspect = Omit<Prospect, "id">;

// This function will be used by components to filter data already fetched from Firestore.
export const getSalesByUser = (uid: string, salesList: Sale[]) => salesList.filter(s => s.salespersonId === uid);
export const getProspectsByUser = (uid: string, prospectsList: Prospect[]) => prospectsList.filter(p => p.salespersonId === uid);
