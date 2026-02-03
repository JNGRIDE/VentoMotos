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

export type Sale = {
  id: string; // Firestore document ID
  salespersonId: string; // This is now the salesperson's UID
  prospectName:string;
  amount: number;
  motorcycleModel: string;
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

// This function will be used by components to filter data already fetched from Firestore.
export const getSalesByUser = (uid: string, salesList: Sale[]) => salesList.filter(s => s.salespersonId === uid);
export const getProspectsByUser = (uid: string, prospectsList: Prospect[]) => prospectsList.filter(p => p.salespersonId === uid);