// types/part.ts
// Mirrors the shape of types/equipment.ts — same conventions, same naming style.

export type StockMovementType = "restock" | "consume" | "adjustment" | "initial";

export interface Part {
  id: number;
  name: string;
  partNumber: string | null;
  description: string | null;
  category: string | null;
  unitOfMeasure: string;
  quantityOnHand: number;
  minQuantity: number;
  reorderQuantity: number | null;
  unitCost: number;
  vendor: string | null;
  vendorPartNumber: string | null;
  location: string | null;
  barcode: string | null;
  linkedEquipmentIds: number[];
  active?: boolean;
  isLowStock?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Fields the create/edit form actually submits
export type PartFormInput = Omit<
  Part,
  "id" | "active" | "isLowStock" | "createdAt" | "updatedAt" | "linkedEquipmentIds" | "quantityOnHand"
> & {
  linkedEquipmentIds: number[];
  quantityOnHand: number; // only used on create — locked after that (see backend note)
};

export const EMPTY_PART_FORM: PartFormInput = {
  name: "",
  partNumber: null,
  description: null,
  category: null,
  unitOfMeasure: "pcs",
  quantityOnHand: 0,
  minQuantity: 0,
  reorderQuantity: null,
  unitCost: 0,
  vendor: null,
  vendorPartNumber: null,
  location: null,
  barcode: null,
  linkedEquipmentIds: [],
};

export interface PartStockMovement {
  _id?: string;
  partId: number;
  type: StockMovementType;
  quantityDelta: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string | null;
  referenceType: "maintenance_request" | "manual" | null;
  referenceId: number | null;
  performedById: string | null;
  performedByName: string | null;
  createdAt: string;
}

export interface PartFilters {
  category?: string;
  equipmentId?: number;
  lowStockOnly?: boolean;
  search?: string;
}

// Common unit-of-measure options for the create/edit form
export const UNIT_OF_MEASURE_OPTIONS = ["pcs", "box", "kg", "g", "l", "ml", "m", "roll", "pair"];

export const MOVEMENT_TYPE_LABEL: Record<StockMovementType, string> = {
  restock: "Restock",
  consume: "Consumed",
  adjustment: "Adjustment",
  initial: "Initial stock",
};