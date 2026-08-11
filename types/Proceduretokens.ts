import { ProcedureStatus, ProcedureFieldType } from "@/redux/procedure/Procedureapi";

export const PROCEDURE_STATUS_CONFIG: Record<
  ProcedureStatus,
  { label: string; bg: string; text: string; border: string; dot: string; icon: string }
> = {
  draft: {
    label: "Draft",
    bg: "#F9FAFB",
    text: "#374151",
    border: "#E5E7EB",
    dot: "#9CA3AF",
    icon: "ti-pencil",
  },
  published: {
    label: "Published",
    bg: "#F0FDF4",
    text: "#15803D",
    border: "#BBF7D0",
    dot: "#22C55E",
    icon: "ti-circle-check",
  },
};

// ── Field type config — icon + short description for the field picker ────────

export const FIELD_TYPE_CONFIG: Record<
  ProcedureFieldType,
  { label: string; description: string; icon: string; bg: string; text: string }
> = {
  section_header: {
    label: "Section header",
    description: "Groups the fields below it — not answerable",
    icon: "ti-heading",
    bg: "#F9FAFB",
    text: "#374151",
  },
  text: {
    label: "Text",
    description: "Free-text answer",
    icon: "ti-align-left",
    bg: "#EFF6FF",
    text: "#1D4ED8",
  },
  number: {
    label: "Number",
    description: "Numeric answer, e.g. a reading or count",
    icon: "ti-123",
    bg: "#EFF6FF",
    text: "#1D4ED8",
  },
  checkbox: {
    label: "Checkbox",
    description: "Yes / no confirmation",
    icon: "ti-square-check",
    bg: "#F0FDF4",
    text: "#15803D",
  },
  multiple_choice: {
    label: "Multiple choice",
    description: "Pick one from a list of options",
    icon: "ti-list-details",
    bg: "#FDF4FF",
    text: "#7E22CE",
  },
  inspection: {
    label: "Inspection",
    description: "Pass / flagged / fail",
    icon: "ti-clipboard-check",
    bg: "#FFF7ED",
    text: "#C2410C",
  },
  photo: {
    label: "Photo",
    description: "Attach a photo as evidence",
    icon: "ti-camera",
    bg: "#F0FDFA",
    text: "#0F766E",
  },
  signature: {
    label: "Signature",
    description: "Signed sign-off",
    icon: "ti-signature",
    bg: "#FFFBEB",
    text: "#92400E",
  },
  date: {
    label: "Date",
    description: "Date picker answer",
    icon: "ti-calendar",
    bg: "#EFF6FF",
    text: "#1D4ED8",
  },
};

// Only these types can carry a point value when procedure scoring is on.
export const SCORABLE_FIELD_TYPES: ProcedureFieldType[] = ["checkbox", "multiple_choice", "inspection"];

// Types that don't collect an answer at all (no "required" toggle needed).
export const NON_ANSWERABLE_FIELD_TYPES: ProcedureFieldType[] = ["section_header"];

export const INSPECTION_OPTIONS = [
  { value: "pass", label: "Pass" },
  { value: "flagged", label: "Flagged" },
  { value: "fail", label: "Fail" },
] as const;