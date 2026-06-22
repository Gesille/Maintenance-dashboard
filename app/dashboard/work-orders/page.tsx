"use client";

import { useState, useCallback, useMemo } from "react";
import { WorkOrderSidebar } from "@/component/Sidebar";
import { WODetailPanel } from "@/component/WODetailPanel";
import { WOListPanel } from "@/component/WOListPanel";
import { WorkOrder, WOStatus, WOPriority, Assignee } from "@/types/types";
import { AVATAR_COLORS } from "@/types/tokens";
import {
  MaintenanceRequest,
  RepairState,
  useGetAllMaintenanceRequestsQuery,
} from "@/redux/Maintenance/Maintenanceapi";
import { useUpdateMaintenanceStatusMutation } from "@/redux/Maintenance/Maintenanceapi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_CYCLE = Object.keys(AVATAR_COLORS) as Assignee["color"][];

function avatarColor(index: number): Assignee["color"] {
  return AVATAR_CYCLE[index % AVATAR_CYCLE.length];
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return "No description provided.";
  return (
    html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim() || "No description provided."
  );
}

export function woStatusToRepairState(status: WOStatus): RepairState {
  switch (status) {
    case "in_progress": return "under_repair";
    case "done":        return "done";
    case "on_hold":     return "cancel";
    case "open":
    default:            return "new";
  }
}

function mapState(state: RepairState): WOStatus {
  switch (state) {
    case "under_repair": return "in_progress";
    case "done":         return "done";
    case "cancel":       return "on_hold";
    case "new":
    default:             return "open";
  }
}

function mapPriority(label: string): WOPriority {
  if (label === "High" || label === "Very Urgent") return "high";
  if (label === "Normal") return "medium";
  return "low";
}

function normCategory(name: string | null | undefined): string {
  if (!name) return "General";
  const n = name.toLowerCase();
  if (n.includes("plumb")) return "Plumbing";
  if (n.includes("electr")) return "Electrical";
  if (n.includes("hvac") || n.includes("refrig")) return "HVAC / Refrigeration";
  if (n.includes("sanit") || n.includes("clean")) return "Sanitation";
  return "General";
}

function toWorkOrder(r: MaintenanceRequest, index: number): WorkOrder {
  const status = mapState(r.state);
  const overdue = !!(
    r.scheduleDate &&
    status !== "done" &&
    new Date(r.scheduleDate) < new Date()
  );

  const locationRaw = r.equipment?.location;
  const location =
    typeof locationRaw === "string"
      ? locationRaw
      : locationRaw?.name ?? "—";

  return {
    id: `#${r.id}`,
    numericId: r.id,
    title: r.name,
    requestedBy: r.createdBy?.name ?? "Unknown",
    status,
    priority: mapPriority(r.priority),
    dueDate: formatDate(r.scheduleDate),
    scheduleEnd: formatDate(r.scheduleEnd),
    createDate: formatDate(r.createDate),
    duration: r.duration,
    overdue,
    completedOn: status === "done" ? formatDate(r.closeDate) : undefined,
    description: stripHtml(r.description),
    asset: r.equipment?.name ?? "—",
    assetCode: r.equipment?.assetCode ?? null,
    serialNo: r.equipment?.serialNo ?? null,
    model: r.equipment?.model ?? null,
    location,
    category: normCategory(r.category?.name),
    categoryLabel: r.category?.name ?? "—",
    maintenanceTeam: r.maintenanceTeam?.name ?? "—",
    maintenanceType: r.maintenanceType ?? "—",
    stage: r.stage?.name ?? "—",
    isRecurring: r.isRecurring,
    assignees: r.technicians.map((t, i) => ({
      initials: initials(t.name),
      name: t.name,
      color: avatarColor(index + i),
    })),
    checklist: [],
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkOrdersPage() {
  const { data, isLoading, isError, refetch } =
    useGetAllMaintenanceRequestsQuery();
  const [updateStatus] = useUpdateMaintenanceStatusMutation();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, WOStatus>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const baseWorkOrders: WorkOrder[] = useMemo(
    () => (data?.data?.requests ?? []).map((r, i) => toWorkOrder(r, i)),
    [data]
  );

  const workOrders: WorkOrder[] = useMemo(
    () =>
      baseWorkOrders.map((wo) =>
        statusOverrides[wo.id] ? { ...wo, status: statusOverrides[wo.id] } : wo
      ),
    [baseWorkOrders, statusOverrides]
  );

  const effectiveId = selectedId ?? workOrders[0]?.id ?? null;
  const selectedWO = workOrders.find((wo) => wo.id === effectiveId) ?? null;

  const handleSelect = useCallback((wo: WorkOrder) => setSelectedId(wo.id), []);

  const handleStatusChange = useCallback(
    async (id: string, status: WOStatus) => {
      setStatusOverrides((prev) => ({ ...prev, [id]: status }));
      setUpdatingId(id);
      try {
        const numericId = parseInt(id.replace("#", ""));
        const repairState = woStatusToRepairState(status);
        await updateStatus({ id: numericId, state: repairState }).unwrap();
      } catch (err) {
        setStatusOverrides((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        console.error("Status update failed:", err);
      } finally {
        setUpdatingId(null);
      }
    },
    [updateStatus]
  );

  const handleChecklistToggle = useCallback((_id: string, _index: number) => {}, []);
  const handleNew = useCallback(() => console.log("Open new work order form"), []);

  // ── Loading state ──
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #F5F3FF 0%, #EEF2FF 50%, #F0F9FF 100%)",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
            animation: "breathe 1.5s ease-in-out infinite",
          }}
        >
          <i
            className="ti ti-settings"
            style={{ fontSize: 22, color: "#fff" }}
            aria-hidden="true"
          />
        </div>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#3730A3",
              margin: "0 0 4px",
              letterSpacing: "-0.02em",
            }}
          >
            MaintenancePro
          </p>
          <p style={{ fontSize: 12, color: "#A5B4FC", margin: 0 }}>
            Loading work orders…
          </p>
        </div>
        <style>{`
          @keyframes breathe {
            0%, 100% { transform: scale(1); box-shadow: 0 8px 24px rgba(99,102,241,0.35); }
            50% { transform: scale(1.06); box-shadow: 0 12px 32px rgba(99,102,241,0.5); }
          }
        `}</style>
      </div>
    );
  }

  // ── Error state ──
  if (isError) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFF5F5",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "#FEE2E2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i
            className="ti ti-alert-triangle"
            style={{ fontSize: 24, color: "#DC2626" }}
            aria-hidden="true"
          />
        </div>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#7F1D1D",
              margin: "0 0 4px",
              letterSpacing: "-0.02em",
            }}
          >
            Something went wrong
          </p>
          <p style={{ fontSize: 12, color: "#EF4444", margin: 0 }}>
            Failed to load work orders
          </p>
        </div>
        <button
          onClick={refetch}
          style={{
            padding: "9px 20px",
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <i className="ti ti-refresh" style={{ fontSize: 13 }} aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }

  // ── Main layout ──
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#F8FAFF",
      }}
    >
      <WorkOrderSidebar />
      <main style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <WOListPanel
          workOrders={workOrders}
          selectedId={effectiveId}
          onSelect={handleSelect}
          onNew={handleNew}
        />
        {selectedWO && (
          <WODetailPanel
            wo={selectedWO}
            onStatusChange={handleStatusChange}
            onChecklistToggle={handleChecklistToggle}
            updatingId={updatingId}
          />
        )}
      </main>
    </div>
  );
}