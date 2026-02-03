export type Salesperson = {
  uid: string; // Corresponds to Firebase Auth UID
  name: string;
  email: string;
  avatarUrl: string;
  salesGoal: number;
  creditsGoal: number;
};

export type Sale = {
  id: string; // Firestore document ID
  salespersonId: string; // This is now the salesperson's UID
  prospectName:string;
  amount: number;
  motorcycleModel: string; // New field
  date: string;
  paymentMethod: "Cash" | "Financing";
  creditProvider?: "Vento" | "Other";
};

// NewSale will be used in the form
export type NewSale = Omit<Sale, "id" | "date">;

export type Prospect = {
  id: string; // Firestore document ID
  name: string;
  stage: "Potential" | "Appointment" | "Credit" | "Closed";
  source: "Organic" | "Advertising";
  salespersonId: string; // This is now the salesperson's UID
  lastContact: string;
};

// This function will be used by components to filter data fetched from Firestore.
export const getSalesBySalesperson = (id: string, salesList: Sale[]) => salesList.filter(s => s.salespersonId === id);
export const getProspectsBySalesperson = (id: string, prospectsList: Prospect[]) => prospectsList.filter(p => p.salespersonId === id);
