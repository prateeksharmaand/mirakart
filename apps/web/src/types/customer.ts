export interface CustomerAddress {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  type: "SHIPPING" | "BILLING" | "BOTH";
  isDefault: boolean;
}

export interface CustomerProfileDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}
