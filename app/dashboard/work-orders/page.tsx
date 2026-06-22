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

// Maps frontend WOStatus → backend RepairState
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

  // location can be string OR { id, name } depending on API version
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
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, WOStatus>
  >({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const baseWorkOrders: WorkOrder[] = useMemo(
    () => (data?.data.requests ?? []).map((r, i) => toWorkOrder(r, i)),
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
      // Optimistic update
      setStatusOverrides((prev) => ({ ...prev, [id]: status }));
      setUpdatingId(id);

      try {
        const numericId = parseInt(id.replace("#", ""));
        const repairState = woStatusToRepairState(status);
        await updateStatus({ id: numericId, state: repairState }).unwrap();
      } catch (err) {
        // Rollback on failure
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

  const handleChecklistToggle = useCallback(
    (_id: string, _index: number) => {},
    []
  );
  const handleNew = useCallback(
    () => console.log("Open new work order form"),
    []
  );

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8FAFC",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            border: "2.5px solid #E2E8F0",
            borderTop: "2.5px solid #6366F1",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <span style={{ fontSize: 13, color: "#64748B" }}>
          Loading work orders…
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8FAFC",
          gap: 12,
        }}
      >
        <p style={{ color: "#B91C1C", fontSize: 14, margin: 0 }}>
          Failed to load work orders.
        </p>
        <button
          onClick={refetch}
          style={{
            padding: "7px 14px",
            background: "#6366F1",
            color: "#fff",
            border: "none",
            borderRadius: 7,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#F8FAFC",
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