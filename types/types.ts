// WorkOrder — the frontend display model (mapped from MaintenanceRequest)

export type WOStatus = "open" | "in_progress" | "on_hold" | "done";
export type WOPriority = "low" | "medium" | "high";

export interface Assignee {
  initials: string;
  name: string;
  color: string;
}

export interface ChecklistItem {
  label: string;
  done: boolean;
}

export interface WorkOrder {
  // Core
  id: string;           // "#99"
  numericId: number;    // 99  (for API calls)
  title: string;
  requestedBy: string;
  status: WOStatus;
  priority: WOPriority;
media: { url: string; type: "image" | "video" }[];
  // Dates
  
  scheduleEnd: string;
  createDate: string;
  duration: number;
  overdue: boolean;
  completedOn?: string;
closeDateRaw?: string | null;
  // Equipment
  asset: string;
  assetCode: string | null;
  serialNo: string | null;
  model: string | null;
  location: string;
restaurant: string;
  // Classification
  category: string;           
  categoryLabel: string;     
  maintenanceTeam: string;
  maintenanceType: string;
  stage: string;
  isRecurring: boolean;
scheduleDateRaw?: string | null;
  // Content
  description: string;
  assignees: Assignee[];
  checklist: ChecklistItem[];
  checklistResult?: "pass" | "flag" | "fail" | null;
  signatureUrl?: string | null;
}