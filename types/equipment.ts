export interface Equipment {
  id: number;
  name: string;
  category: string | null;
  maintenanceTeam: string | null;
  technician: string | null;
  owner: string | null;
  assignedDate: string | null;
  scrapDate: string | null;
  usedInLocation: string | null;
  restaurant: string | null;
  assetCode: string | null;
  reference: string | null;
  vendor: string | null;
  vendorReference: string | null;
  model: string | null;
  serialNumber: string | null;
  effectiveDate: string | null;
  cost: number;
  warrantyExpirationDate: string | null;
  description: string | null;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
   qrCodeUrl: string | null;
  qrPublicId: string | null;
  qrGenerated: boolean;
}

// Fields the create/edit form actually submits
export type EquipmentFormInput = Omit<
  Equipment,
  "id" | "active" | "createdAt" | "updatedAt"
>;

export const EMPTY_EQUIPMENT_FORM: EquipmentFormInput = {
    name: "",
    category: null,
    maintenanceTeam: null,
    technician: null,
    owner: null,
    assignedDate: null,
    scrapDate: null,
    usedInLocation: null,
    restaurant: null,
    assetCode: null,
    reference: null,
    vendor: null,
    vendorReference: null,
    model: null,
    serialNumber: null,
    effectiveDate: null,
    cost: 0,
    warrantyExpirationDate: null,
    description: null,
    qrCodeUrl: null,
    qrPublicId: null,
    qrGenerated: false
};