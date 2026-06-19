export type WOStatus = "open" | "on_hold" | "in_progress" | "done";
export type WOPriority = "high" | "medium" | "low";

export interface Assignee {
  initials: string;
  name: string;
  color: "blue" | "green" | "amber" | "purple" | "coral";
}

export interface WorkOrder {
  id: string;
  title: string;
  requestedBy: string;
  status: WOStatus;
  priority: WOPriority;
  dueDate: string;
  overdue: boolean;
  description: string;
  asset: string;
  location: string;
  assignees: Assignee[];
  checklist: { label: string; done: boolean }[];
  completedOn?: string;
  category: string;
}