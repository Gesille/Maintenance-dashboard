import { Assignee, WOPriority, WOStatus } from "./types";
import { TicketStatus, TicketCategory } from "@/redux/Supportticket/Supportticketapi";


// ── Status config ─────────────────────────────────────────────────────────────
export const STATUS_CONFIG: Record<
  WOStatus,
  { label: string; bg: string; text: string; border: string; dot: string; icon: string }
> = {
  open: {
    label: "Open",
    bg: "#EFF6FF",
    text: "#1D4ED8",
    border: "#BFDBFE",
    dot: "#3B82F6",
    icon: "ti-lock-open",
  },
  on_hold: {
    label: "On hold",
    bg: "#FFF7ED",
    text: "#C2410C",
    border: "#FED7AA",
    dot: "#F97316",
    icon: "ti-player-pause",
  },
  in_progress: {
    label: "In progress",
    bg: "#F0FDFA",
    text: "#0F766E",
    border: "#99F6E4",
    dot: "#14B8A6",
    icon: "ti-refresh",
  },
  done: {
    label: "Done",
    bg: "#F0FDF4",
    text: "#15803D",
    border: "#BBF7D0",
    dot: "#22C55E",
    icon: "ti-circle-check",
  },
};

// ── Priority config ───────────────────────────────────────────────────────────
export const PRIORITY_CONFIG: Record<
  WOPriority,
  { label: string; bg: string; text: string; border: string }
> = {
  high: {
    label: "High",
    bg: "#FEF2F2",
    text: "#B91C1C",
    border: "#FECACA",
  },
  medium: {
    label: "Medium",
    bg: "#FFFBEB",
    text: "#92400E",
    border: "#FDE68A",
  },
  low: {
    label: "Low",
    bg: "#F0FDF4",
    text: "#166534",
    border: "#BBF7D0",
  },
};

// ── Assignee avatar colors ────────────────────────────────────────────────────
export const AVATAR_COLORS: Record<
  Assignee["color"],
  { bg: string; text: string }
> = {
  blue:   { bg: "#DBEAFE", text: "#1E40AF" },
  green:  { bg: "#DCFCE7", text: "#166534" },
  amber:  { bg: "#FEF3C7", text: "#92400E" },
  purple: { bg: "#EDE9FE", text: "#5B21B6" },
  coral:  { bg: "#FFE4E6", text: "#9F1239" },
};

// ── Category colors ───────────────────────────────────────────────────────────
export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Plumbing:              { bg: "#EFF6FF", text: "#1D4ED8" },
  Electrical:            { bg: "#FFF7ED", text: "#C2410C" },
  "HVAC / Refrigeration":{ bg: "#F0FDFA", text: "#0F766E" },
  Sanitation:            { bg: "#FDF4FF", text: "#7E22CE" },
  General:               { bg: "#F9FAFB", text: "#374151" },
};

// ── Support ticket status config ──────────────────────────────────────────────
export const TICKET_STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; bg: string; text: string; border: string; dot: string; icon: string }
> = {
  open: {
    label: "Open",
    bg: "#EFF6FF",
    text: "#1D4ED8",
    border: "#BFDBFE",
    dot: "#3B82F6",
    icon: "ti-lock-open",
  },
  in_progress: {
    label: "In progress",
    bg: "#F0FDFA",
    text: "#0F766E",
    border: "#99F6E4",
    dot: "#14B8A6",
    icon: "ti-refresh",
  },
  resolved: {
    label: "Resolved",
    bg: "#F0FDF4",
    text: "#15803D",
    border: "#BBF7D0",
    dot: "#22C55E",
    icon: "ti-circle-check",
  },
  closed: {
    label: "Closed",
    bg: "#F9FAFB",
    text: "#374151",
    border: "#E5E7EB",
    dot: "#9CA3AF",
    icon: "ti-lock",
  },
};

// ── Support ticket category config ────────────────────────────────────────────
export const TICKET_CATEGORY_CONFIG: Record<
  TicketCategory,
  { label: string; bg: string; text: string; icon: string }
> = {
  technical_issue: { label: "Technical issue", bg: "#FDF4FF", text: "#7E22CE", icon: "ti-tool" },
  request_not_updating: {
    label: "Request not updating",
    bg: "#FFFBEB",
    text: "#92400E",
    icon: "ti-clock-exclamation",
  },
  account_login: { label: "Account / login", bg: "#EFF6FF", text: "#1D4ED8", icon: "ti-user-lock" },
  equipment: { label: "Equipment", bg: "#FFF7ED", text: "#C2410C", icon: "ti-building-factory-2" },
  other: { label: "Other", bg: "#F9FAFB", text: "#374151", icon: "ti-dots" },
};

// ── Sidebar nav items ─────────────────────────────────────────────────────────
export const NAV_ITEMS = [
  { label: "Work order & Requests", icon: "ti-clipboard-list",  href: "/dashboard/work-orders" },
  { label: "Purchase Orders", icon: "ti-clipboard-list",  href: "/dashboard/purchase-orders" },
  { label: "Support Tickets", icon: "ti-ticket", href: "/dashboard/support-tickets" },
  { label: "Reporting", icon: "ti-chart-bar", href: "/dashboard/reporting" },
  { label: "Parts Inventory", icon: "ti-chart-bar", href: "/dashboard/part-inventory" },

];

export const NAV_ASSET_ITEMS = [
  { label: "Equipment", icon: "ti-building-factory-2", href: "/dashboard/equipment" },
  { label: "QR Code ", icon: "ti-map-pin", href: "/dashboard/qr-code" },
  { label: "Meters", icon: "ti-map-pin", href: "/dashboard/meters" },
];

export const NAV_CONFIG_ITEMS = [
  { label: "Teams / Users", icon: "ti-users", href: "/dashboard/users" },
  { label: "Automations", icon: "ti-bolt", href: "/dashboard/automations" },
  { label: "Settings", icon: "ti-settings", href: "/dashboard/settings" },
];