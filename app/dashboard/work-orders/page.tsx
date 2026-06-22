"use client";

import { useState, useCallback, useMemo } from "react";
import {
  MaintenanceRequest,
  RepairState,
  useGetAllMaintenanceRequestsQuery,
} from "@/redux/Maintenance/Maintenanceapi";
import { WorkOrder, WOStatus, WOPriority, Assignee } from "@/types/types";
import { AVATAR_COLORS } from "@/types/tokens";

// ─── Adapter ─────────────────────────────────────────────────────────────────

const AVATAR_CYCLE = Object.keys(AVATAR_COLORS) as Assignee["color"][];
function avatarColor(i: number): Assignee["color"] {
  return AVATAR_CYCLE[i % AVATAR_CYCLE.length];
}
function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function mapState(state: RepairState): WOStatus {
  switch (state) {
    case "under_repair": return "in_progress";
    case "done":         return "done";
    case "cancel":       return "on_hold";
    default:             return "open";
  }
}
function mapPriority(label: string): WOPriority {
  if (label === "High" || label === "Very Urgent") return "high";
  if (label === "Normal") return "medium";
  return "low";
}
function normCategory(name?: string | null) {
  if (!name) return "General";
  const n = name.toLowerCase();
  if (n.includes("plumb")) return "Plumbing";
  if (n.includes("electr")) return "Electrical";
  if (n.includes("hvac") || n.includes("refrig")) return "HVAC";
  if (n.includes("sanit") || n.includes("clean")) return "Sanitation";
  return "General";
}
function stripHtml(html: string | null | undefined) {
  if (!html) return "No description provided.";
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() || "No description provided.";
}
function toWorkOrder(r: MaintenanceRequest, index: number): WorkOrder {
  const status = mapState(r.state);
  const overdue = !!(r.scheduleDate && status !== "done" && new Date(r.scheduleDate) < new Date());
  return {
    id: `#${r.id}`,
    title: r.name,
    requestedBy: r.createdBy?.name ?? "Unknown",
    status,
    priority: mapPriority(r.priority),
    dueDate: formatDate(r.scheduleDate),
    overdue,
    completedOn: status === "done" ? formatDate(r.closeDate) : undefined,
    description: stripHtml(r.description),
    asset: r.equipment?.name ?? "—",
    location: r.equipment?.location?.name ?? "—",
    category: normCategory(r.category?.name),
    assignees: r.technicians.map((t, i) => ({
      initials: initials(t.name),
      name: t.name,
      color: avatarColor(index + i),
    })),
    checklist: [],
  };
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<WOStatus, { label: string; dot: string; bg: string; text: string; border: string }> = {
  open:        { label: "Open",        dot: "#3B82F6", bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  in_progress: { label: "In progress", dot: "#F59E0B", bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
  on_hold:     { label: "On hold",     dot: "#6B7280", bg: "#F9FAFB", text: "#374151", border: "#E5E7EB" },
  done:        { label: "Done",        dot: "#10B981", bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
};

const PRIORITY_CFG: Record<WOPriority, { label: string; bg: string; text: string; border: string }> = {
  high:   { label: "High",   bg: "#FEF2F2", text: "#991B1B", border: "#FECACA" },
  medium: { label: "Medium", bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
  low:    { label: "Low",    bg: "#F0FDF4", text: "#14532D", border: "#BBF7D0" },
};

const CATEGORY_COLOR: Record<string, string> = {
  Plumbing:   "#3B82F6",
  Electrical: "#F97316",
  HVAC:       "#14B8A6",
  Sanitation: "#A855F7",
  General:    "#94A3B8",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name, color, size = 28 }: { name: string; color: Assignee["color"]; size?: number }) {
  const av = AVATAR_COLORS[color];
  return (
    <div
      title={name}
      style={{
        width: size, height: size, borderRadius: "50%",
        background: av?.bg ?? "#E0E7FF",
        color: av?.text ?? "#3730A3",
        fontSize: size * 0.36,
        fontWeight: 600,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        border: "2px solid #fff",
        fontFamily: "inherit",
      }}
    >
      {initials(name)}
    </div>
  );
}

function StatusBadge({ status }: { status: WOStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11, fontWeight: 500,
      background: cfg.bg, color: cfg.text,
      border: `1px solid ${cfg.border}`,
      padding: "2px 8px", borderRadius: 99,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: WOPriority }) {
  const cfg = PRIORITY_CFG[priority];
  return (
    <span style={{
      fontSize: 11, fontWeight: 500,
      background: cfg.bg, color: cfg.text,
      border: `1px solid ${cfg.border}`,
      padding: "2px 8px", borderRadius: 99,
    }}>
      {cfg.label}
    </span>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const NAV = [
  { label: "Work orders", icon: "ti-tool", href: "/work-orders" },
  { label: "Purchase orders", icon: "ti-shopping-cart", href: "/purchase-orders" },
  { label: "Reporting", icon: "ti-chart-bar", href: "/reporting" },
  { label: "Requests", icon: "ti-clipboard-list", href: "/requests", badge: 1 },
];
const NAV_ASSETS = [
  { label: "Assets", icon: "ti-building-factory-2", href: "/assets" },
  { label: "Parts inventory", icon: "ti-package", href: "/parts" },
  { label: "Locations", icon: "ti-map-pin", href: "/locations" },
];
const NAV_CONFIG = [
  { label: "Teams / Users", icon: "ti-users", href: "/teams" },
  { label: "Automations", icon: "ti-bolt", href: "/automations" },
  { label: "Settings", icon: "ti-settings", href: "/settings" },
];

function Sidebar({ activePath = "/work-orders" }: { activePath?: string }) {
  return (
    <aside style={{
      width: 224, flexShrink: 0,
      background: "#fff",
      borderRight: "1px solid #F1F5F9",
      display: "flex", flexDirection: "column",
      height: "100vh", position: "sticky", top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "18px 16px 16px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "#0F172A",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <i className="ti ti-tool" style={{ fontSize: 16, color: "#93C5FD" }} />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: 0 }}>MaintenancePro</p>
          <p style={{ fontSize: 10, color: "#94A3B8", margin: 0, letterSpacing: "0.06em", textTransform: "uppercase" }}>Enterprise</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {NAV.map((item) => {
          const active = activePath === item.href;
          return (
            <a key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "7px 16px",
              fontSize: 13, color: active ? "#1E40AF" : "#475569",
              textDecoration: "none",
              background: active ? "#EFF6FF" : "transparent",
              borderLeft: `2px solid ${active ? "#3B82F6" : "transparent"}`,
              fontWeight: active ? 500 : 400,
              transition: "all 0.1s",
            }}>
              <i className={`ti ${item.icon}`} style={{ fontSize: 15 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge !== undefined && (
                <span style={{
                  background: "#EFF6FF", color: "#1E40AF",
                  fontSize: 10, fontWeight: 600,
                  padding: "1px 6px", borderRadius: 99,
                }}>{item.badge}</span>
              )}
            </a>
          );
        })}

        <p style={{ padding: "16px 16px 4px", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#CBD5E1" }}>Assets</p>
        {NAV_ASSETS.map((item) => {
          const active = activePath === item.href;
          return (
            <a key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "7px 16px", fontSize: 13,
              color: active ? "#1E40AF" : "#475569",
              textDecoration: "none",
              background: active ? "#EFF6FF" : "transparent",
              borderLeft: `2px solid ${active ? "#3B82F6" : "transparent"}`,
            }}>
              <i className={`ti ${item.icon}`} style={{ fontSize: 15 }} />
              {item.label}
            </a>
          );
        })}

        <p style={{ padding: "16px 16px 4px", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#CBD5E1" }}>Config</p>
        {NAV_CONFIG.map((item) => {
          const active = activePath === item.href;
          return (
            <a key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "7px 16px", fontSize: 13,
              color: active ? "#1E40AF" : "#475569",
              textDecoration: "none",
              background: active ? "#EFF6FF" : "transparent",
              borderLeft: `2px solid ${active ? "#3B82F6" : "transparent"}`,
            }}>
              <i className={`ti ${item.icon}`} style={{ fontSize: 15 }} />
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "#0F172A", color: "#fff",
          fontSize: 11, fontWeight: 600,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>GG</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: "#0F172A", margin: 0 }}>Giselle Georges</p>
          <p style={{ fontSize: 10, color: "#94A3B8", margin: 0 }}>Administrator</p>
        </div>
        <i className="ti ti-chevron-right" style={{ fontSize: 12, color: "#CBD5E1" }} />
      </div>
    </aside>
  );
}

// ─── List Panel ───────────────────────────────────────────────────────────────

type Tab = "open" | "done" | "all";

function ListPanel({
  workOrders,
  selectedId,
  onSelect,
}: {
  workOrders: WorkOrder[];
  selectedId: string | null;
  onSelect: (wo: WorkOrder) => void;
}) {
  const [tab, setTab] = useState<Tab>("open");
  const [search, setSearch] = useState("");

  const filtered = workOrders.filter((wo) => {
    const matchTab = tab === "all" ? true : tab === "done" ? wo.status === "done" : wo.status !== "done";
    const q = search.toLowerCase();
    return matchTab && (!q || wo.title.toLowerCase().includes(q) || wo.id.toLowerCase().includes(q));
  });

  return (
    <div style={{
      width: 320, flexShrink: 0,
      background: "#FAFAFA",
      borderRight: "1px solid #F1F5F9",
      display: "flex", flexDirection: "column",
      height: "100%", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #F1F5F9", padding: "16px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h1 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", margin: 0 }}>Work orders</h1>
          <button style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "5px 12px",
            background: "#0F172A", color: "#fff",
            border: "none", borderRadius: 7,
            fontSize: 12, fontWeight: 500, cursor: "pointer",
          }}>
            <i className="ti ti-plus" style={{ fontSize: 13 }} /> New
          </button>
        </div>

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#F8FAFC", border: "1px solid #E2E8F0",
          borderRadius: 7, padding: "0 10px", height: 34, marginBottom: 12,
        }}>
          <i className="ti ti-search" style={{ fontSize: 13, color: "#94A3B8" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search work orders…"
            style={{
              border: "none", background: "transparent",
              fontSize: 13, color: "#0F172A", outline: "none", width: "100%",
            }}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex" }}>
          {(["open", "done", "all"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "7px 14px", fontSize: 12, fontWeight: 500,
              color: tab === t ? "#1E40AF" : "#64748B",
              background: "none", border: "none",
              borderBottom: `2px solid ${tab === t ? "#3B82F6" : "transparent"}`,
              cursor: "pointer", marginBottom: -1, textTransform: "capitalize",
            }}>
              {t === "open" ? "Open" : t === "done" ? "Done" : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div style={{ padding: "10px 16px", fontSize: 11, color: "#94A3B8", borderBottom: "1px solid #F1F5F9" }}>
        <strong style={{ color: "#475569" }}>{filtered.length}</strong> orders
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px 12px" }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 16px", color: "#94A3B8", fontSize: 13 }}>
            <i className="ti ti-clipboard-off" style={{ fontSize: 32, display: "block", marginBottom: 8 }} />
            No work orders found
          </div>
        )}
        {filtered.map((wo) => {
          const catColor = CATEGORY_COLOR[wo.category] ?? "#94A3B8";
          const isSelected = wo.id === selectedId;
          return (
            <div
              key={wo.id}
              onClick={() => onSelect(wo)}
              style={{
                padding: "13px 13px 13px 15px",
                borderRadius: 10,
                border: `1px solid ${isSelected ? "#BFDBFE" : "#E2E8F0"}`,
                borderLeft: `3px solid ${catColor}`,
                background: isSelected ? "#F0F7FF" : "#fff",
                marginBottom: 6,
                cursor: "pointer",
                transition: "all 0.1s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#0F172A", margin: 0, lineHeight: 1.4, flex: 1, paddingRight: 8 }}>
                  {wo.title}
                </p>
                <span style={{ fontSize: 10, color: "#94A3B8", flexShrink: 0 }}>{wo.id}</span>
              </div>
              <p style={{ fontSize: 11, color: "#94A3B8", margin: "0 0 8px" }}>
                {wo.requestedBy} · {wo.category}
              </p>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                <StatusBadge status={wo.status} />
                {wo.overdue && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 3,
                    fontSize: 11, fontWeight: 500,
                    background: "#FEF2F2", color: "#991B1B",
                    border: "1px solid #FECACA",
                    padding: "2px 7px", borderRadius: 99,
                  }}>
                    <i className="ti ti-clock" style={{ fontSize: 10 }} /> Overdue
                  </span>
                )}
                <PriorityBadge priority={wo.priority} />
                <div style={{ marginLeft: "auto", display: "flex" }}>
                  {wo.assignees.slice(0, 3).map((a, i) => (
                    <div key={i} style={{ marginLeft: i > 0 ? -6 : 0 }}>
                      <Avatar name={a.name} color={a.color} size={22} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  wo,
  onStatusChange,
}: {
  wo: WorkOrder;
  onStatusChange: (id: string, status: WOStatus) => void;
}) {
  const catColor = CATEGORY_COLOR[wo.category] ?? "#94A3B8";
  const priority = PRIORITY_CFG[wo.priority];
  const [note, setNote] = useState("");

  const STATUS_STEPS: WOStatus[] = ["open", "in_progress", "on_hold", "done"];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff" }}>
      {/* Top bar */}
      <div style={{
        padding: "0 28px",
        height: 52,
        borderBottom: "1px solid #F1F5F9",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.07em",
            textTransform: "uppercase",
            background: catColor + "18",
            color: catColor,
            padding: "3px 8px", borderRadius: 5,
          }}>{wo.category}</span>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>{wo.id}</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={topBtn}><i className="ti ti-message" style={{ fontSize: 13 }} /> Comments</button>
          <button style={topBtn}><i className="ti ti-pencil" style={{ fontSize: 13 }} /> Edit</button>
          <button style={{ ...topBtn, padding: "5px 8px" }}><i className="ti ti-dots" style={{ fontSize: 14 }} /></button>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

        {/* Title + meta */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#0F172A", margin: "0 0 6px", lineHeight: 1.3 }}>
            {wo.title}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748B" }}>
              <i className="ti ti-calendar" style={{ fontSize: 13 }} />
              {wo.completedOn ? `Completed ${wo.completedOn}` : `Due ${wo.dueDate}`}
            </span>
            {wo.overdue && (
              <span style={{ fontSize: 11, fontWeight: 500, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", padding: "1px 7px", borderRadius: 99 }}>
                Overdue
              </span>
            )}
          </div>
        </div>

        {/* Status stepper */}
        <div style={{ marginBottom: 28 }}>
          <Label>Status</Label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {STATUS_STEPS.map((s) => {
              const cfg = STATUS_CFG[s];
              const isActive = wo.status === s;
              return (
                <button
                  key={s}
                  onClick={() => onStatusChange(wo.id, s)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "7px 16px",
                    borderRadius: 7,
                    border: `1.5px solid ${isActive ? cfg.border : "#E2E8F0"}`,
                    background: isActive ? cfg.bg : "#FAFAFA",
                    color: isActive ? cfg.text : "#64748B",
                    fontSize: 12, fontWeight: isActive ? 600 : 400,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: isActive ? cfg.dot : "#CBD5E1",
                  }} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Key metrics row */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3,1fr)",
          border: "1px solid #F1F5F9", borderRadius: 10, overflow: "hidden",
          marginBottom: 28,
        }}>
          <MetaCell label="Due date" icon="ti-calendar" value={wo.dueDate} />
          <MetaCell label="Priority" icon="ti-flag" value={
            <span style={{
              fontSize: 12, fontWeight: 500,
              background: priority.bg, color: priority.text,
              border: `1px solid ${priority.border}`,
              padding: "2px 9px", borderRadius: 99,
            }}>{priority.label}</span>
          } noBorderRight={false} />
          <MetaCell label="Work order ID" icon="ti-hash" value={wo.id} noBorderRight />
        </div>

        {/* Assignees */}
        <Section label="Assigned to">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {wo.assignees.length === 0
              ? <span style={{ fontSize: 13, color: "#94A3B8" }}>No assignees</span>
              : wo.assignees.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar name={a.name} color={a.color} size={30} />
                    <span style={{ fontSize: 13, color: "#374151" }}>{a.name}</span>
                  </div>
                ))
            }
          </div>
        </Section>

        <Divider />

        {/* Asset + Location */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <Section label="Asset">
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#374151" }}>
              <i className="ti ti-building-factory-2" style={{ fontSize: 15, color: "#94A3B8" }} />
              {wo.asset}
            </div>
          </Section>
          <Section label="Location">
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#374151" }}>
              <i className="ti ti-map-pin" style={{ fontSize: 15, color: "#94A3B8" }} />
              {wo.location}
            </div>
          </Section>
        </div>

        <Divider />

        {/* Description */}
        <Section label="Description">
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, margin: 0 }}>
            {wo.description}
          </p>
        </Section>

        <Divider />

        {/* Checklist */}
        {wo.checklist.length > 0 && (
          <>
            <Section label={`Checklist · ${wo.checklist.filter(c => c.done).length}/${wo.checklist.length}`}>
              <div style={{ height: 3, background: "#F1F5F9", borderRadius: 99, marginBottom: 12, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  background: "#3B82F6",
                  width: `${wo.checklist.length ? Math.round(wo.checklist.filter(c => c.done).length / wo.checklist.length * 100) : 0}%`,
                  transition: "width 0.3s",
                }} />
              </div>
              {wo.checklist.map((item, i) => (
                <label key={i} style={{
                  display: "flex", alignItems: "center", gap: 9,
                  fontSize: 13, color: item.done ? "#94A3B8" : "#374151",
                  textDecoration: item.done ? "line-through" : "none",
                  cursor: "pointer", marginBottom: 8,
                }}>
                  <input type="checkbox" checked={item.done} readOnly
                    style={{ width: 14, height: 14, accentColor: "#3B82F6", flexShrink: 0 }} />
                  {item.label}
                </label>
              ))}
            </Section>
            <Divider />
          </>
        )}

        {/* Internal notes */}
        <Section label="Internal notes">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note for the team…"
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box",
              fontSize: 13, resize: "vertical",
              padding: "10px 12px",
              borderRadius: 8, border: "1px solid #E2E8F0",
              background: "#FAFAFA", color: "#374151",
              outline: "none", fontFamily: "inherit", lineHeight: 1.6,
            }}
          />
          {note && (
            <button style={{
              marginTop: 8, padding: "6px 14px",
              background: "#0F172A", color: "#fff",
              border: "none", borderRadius: 7,
              fontSize: 12, fontWeight: 500, cursor: "pointer",
            }}>
              Save note
            </button>
          )}
        </Section>

      </div>
    </div>
  );
}

// ─── Helper micro-components ──────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94A3B8", margin: "0 0 10px" }}>
      {children}
    </p>
  );
}
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 11, color: "#94A3B8", margin: "0 0 7px" }}>{label}</p>
      {children}
    </div>
  );
}
function Divider() {
  return <div style={{ height: 1, background: "#F8FAFC", margin: "4px 0 20px" }} />;
}
function MetaCell({ label, icon, value, noBorderRight = false }: { label: string; icon: string; value: React.ReactNode; noBorderRight?: boolean }) {
  return (
    <div style={{ padding: "13px 16px", borderRight: noBorderRight ? "none" : "1px solid #F1F5F9" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 13 }} />
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{value}</div>
    </div>
  );
}

const topBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5,
  padding: "5px 11px", fontSize: 12, fontWeight: 400,
  color: "#475569", background: "#fff",
  border: "1px solid #E2E8F0", borderRadius: 7, cursor: "pointer",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkOrdersPage() {
  const { data, isLoading, isError, refetch } = useGetAllMaintenanceRequestsQuery();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localStatuses, setLocalStatuses] = useState<Record<string, WOStatus>>({});

  const workOrders: WorkOrder[] = useMemo(
    () => (data?.data.requests ?? []).map((r, i) => toWorkOrder(r, i)),
    [data],
  );

  const effectiveId = selectedId ?? workOrders[0]?.id ?? null;

  const enriched = useMemo(
    () => workOrders.map((wo) => ({ ...wo, status: localStatuses[wo.id] ?? wo.status })),
    [workOrders, localStatuses],
  );

  const selectedWO = enriched.find((wo) => wo.id === effectiveId) ?? null;

  const handleSelect = useCallback((wo: WorkOrder) => setSelectedId(wo.id), []);

  // ✅ Status change is now wired — updates locally (until mutation is added)
  const handleStatusChange = useCallback((id: string, status: WOStatus) => {
    setLocalStatuses((prev) => ({ ...prev, [id]: status }));
  }, []);

  if (isLoading) return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#F8FAFC", flexDirection: "column", gap: 12 }}>
      <div style={{ width: 32, height: 32, border: "3px solid #E2E8F0", borderTop: "3px solid #3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>Loading work orders…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (isError) return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#F8FAFC", flexDirection: "column", gap: 12 }}>
      <i className="ti ti-alert-circle" style={{ fontSize: 32, color: "#EF4444" }} />
      <p style={{ fontSize: 14, color: "#DC2626", margin: 0 }}>Failed to load work orders</p>
      <button onClick={refetch} style={{
        padding: "7px 16px", background: "#0F172A", color: "#fff",
        border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer",
      }}>Retry</button>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8FAFC" }}>
      <Sidebar activePath="/work-orders" />
      <main style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <ListPanel workOrders={enriched} selectedId={effectiveId} onSelect={handleSelect} />
        {selectedWO
          ? <DetailPanel wo={selectedWO} onStatusChange={handleStatusChange} />
          : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: 13 }}>
              Select a work order to view details
            </div>
          )
        }
      </main>
    </div>
  );
}