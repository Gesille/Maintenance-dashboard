export const INDIGO = "#6366F1";
export const VIOLET = "#8B5CF6";

export const CHART_PALETTE = [
  INDIGO, VIOLET, "#22C55E", "#F97316", "#0EA5E9", "#EC4899", "#F59E0B", "#14B8A6",
];

export const RANGE_OPTIONS = [
  { label: "Last 7 days", days: 7 },
  { label: "Weekly Reports", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
] as const;

export const TABS = [
  "Summary",
  "Asset Health",
  "Reporting Details",
  "Recent Activity",
  "Export Data",
  "Custom Dashboards",
] as const;

export const STATUS_ORDER: Array<{ key: "open" | "inProgress" | "onHold" | "done"; woKey: "open" | "on_hold" | "in_progress" | "done" }> = [
  { key: "open", woKey: "open" },
  { key: "onHold", woKey: "on_hold" },
  { key: "inProgress", woKey: "in_progress" },
  { key: "done", woKey: "done" },
];

export const PRIORITY_LABEL: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "None",
};