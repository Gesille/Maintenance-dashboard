export interface Vendor {
  id: number;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
  active?: boolean;
}

export type VendorFormInput = Omit<Vendor, "id" | "active">;

export const EMPTY_VENDOR_FORM: VendorFormInput = {
  name: "",
  contactName: null,
  phone: null,
  email: null,
  address: null,
  website: null,
  notes: null,
};