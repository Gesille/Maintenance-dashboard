import { MeterStatus, MeterType, MeterReadingTypeKind, TriggerOperator } from "@/redux/Meter/Meterapi";

// ── Meter status config (mirrors STATUS_CONFIG in types/tokens.ts) ────────────
// Merge this into tokens.ts, or import directly — kept separate so the
// existing file isn't touched.

export const METER_STATUS_CONFIG: Record<
  MeterStatus,
  { label: string; bg: string; text: string; border: string; dot: string; icon: string }
> = {
  pending: {
    label: "Pending",
    bg: "#F9FAFB",
    text: "#374151",
    border: "#E5E7EB",
    dot: "#9CA3AF",
    icon: "ti-clock",
  },
  stable: {
    label: "Stable",
    bg: "#F0FDF4",
    text: "#15803D",
    border: "#BBF7D0",
    dot: "#22C55E",
    icon: "ti-circle-check",
  },
  triggered: {
    label: "Triggered",
    bg: "#FEF2F2",
    text: "#B91C1C",
    border: "#FECACA",
    dot: "#EF4444",
    icon: "ti-alert-triangle",
  },
};

export const METER_TYPE_LABELS: Record<MeterType, string> = {
  manual: "Manual",
  automated: "Automated",
};

export const READING_TYPE_LABELS: Record<MeterReadingTypeKind, string> = {
  cumulative: "Cumulative",
  gauge: "Gauge",
};

export const READING_TYPE_HINT: Record<MeterReadingTypeKind, string> = {
  cumulative: "Only ever increases (odometer, run-hours, cycle count)",
  gauge: "Fluctuates freely (temperature, pressure, tank level)",
};

export const TRIGGER_OPERATOR_LABELS: Record<TriggerOperator, string> = {
  gte: "reaches or exceeds",
  lte: "drops to or below",
  eq: "equals exactly",
  between: "falls within range",
  increased_by: "increases by at least",
};

export const PRIORITY_OPTIONS = ["low", "medium", "high"] as const;