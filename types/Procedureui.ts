import { ProcedureFieldType, ProcedureStatus } from "@/redux/procedure/Procedureapi";

// ── Brand ──────────────────────────────────────────────────────────────────
// Shared across every procedure-library surface (list, detail, field editor,
// attach/new modals) so the whole feature reads as one system rather than a
// collection of one-off screens.

export const BRAND_GRADIENT = "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)";
export const BRAND_SOFT_BG = "#EEF2FF";
export const BRAND_SOFT_BORDER = "#E0E7FF";
export const BRAND_TEXT = "#4F46E5";

// ── Status pills ───────────────────────────────────────────────────────────

interface StatusStyle {
  label: string;
  fg: string;
  bg: string;
  dot: string;
  border: string;
}

export const STATUS_STYLES: Record<ProcedureStatus, StatusStyle> = {
  draft: { label: "Draft", fg: "#92400E", bg: "#FFFBEB", dot: "#F59E0B", border: "#FDE68A" },
  published: { label: "Published", fg: "#065F46", bg: "#ECFDF5", dot: "#10B981", border: "#A7F3D0" },
};

// ── Field type metadata ────────────────────────────────────────────────────
// Icon + label (+ description) shown in the field-type picker and on each
// field row in the detail panel.

interface FieldTypeMeta {
  icon: string;
  label: string;
  description: string;
}

const FIELD_TYPE_META: Record<ProcedureFieldType, FieldTypeMeta> = {
  section_header: { icon: "ti-heading", label: "Section", description: "Groups the fields below it — not answerable" },
  text: { icon: "ti-align-left", label: "Text", description: "Free-text answer" },
  number: { icon: "ti-123", label: "Number", description: "Numeric answer, e.g. a reading or count" },
  checkbox: { icon: "ti-square-check", label: "Checkbox", description: "Yes / no confirmation" },
  multiple_choice: { icon: "ti-list-details", label: "Multi-choice", description: "Pick one option from a list" },
  inspection: { icon: "ti-clipboard-check", label: "Inspection", description: "Pass / flagged / fail" },
  photo: { icon: "ti-camera", label: "Photo", description: "Attach a photo as evidence" },
  signature: { icon: "ti-signature", label: "Signature", description: "Signed sign-off" },
  date: { icon: "ti-calendar", label: "Date", description: "Date picker answer" },
};

export function fieldTypeMeta(type: ProcedureFieldType): FieldTypeMeta {
  return FIELD_TYPE_META[type];
}

// Only these types can carry a point value when procedure scoring is on.
export const SCORABLE_FIELD_TYPES: ProcedureFieldType[] = ["checkbox", "multiple_choice", "inspection"];

export const INSPECTION_OPTIONS = [
  { value: "pass", label: "Pass" },
  { value: "flagged", label: "Flagged" },
  { value: "fail", label: "Fail" },
] as const;

// ── Time formatting ────────────────────────────────────────────────────────

export function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}