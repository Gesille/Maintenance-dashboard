"use client";

import { useState, useCallback, useMemo } from "react";
import { WorkOrderSidebar } from "@/component/Sidebar";
import { WODetailPanel }    from "@/component/WODetailPanel";
import { WOListPanel }      from "@/component/WOListPanel";
import { WorkOrder, WOStatus, WOPriority, Assignee } from "@/types/types";
import { AVATAR_COLORS } from "@/types/tokens";
import { MaintenanceRequest, RepairState, useGetAllMaintenanceRequestsQuery } from "@/redux/Maintenance/Maintenanceapi";


// ─── Adapter: MaintenanceRequest → WorkOrder ──────────────────────────────────

const AVATAR_CYCLE = Object.keys(AVATAR_COLORS) as Assignee["color"][];

function avatarColor(index: number): Assignee["color"] {
  return AVATAR_CYCLE[index % AVATAR_CYCLE.length];
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
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
  if (label === "Normal")                          return "medium";
  return "low";
}

function normCategory(name: string | null | undefined): string {
  if (!name) return "General";
  const n = name.toLowerCase();
  if (n.includes("plumb"))                        return "Plumbing";
  if (n.includes("electr"))                       return "Electrical";
  if (n.includes("hvac") || n.includes("refrig")) return "HVAC / Refrigeration";
  if (n.includes("sanit") || n.includes("clean")) return "Sanitation";
  return "General";
}

function toWorkOrder(r: MaintenanceRequest, index: number): WorkOrder {
  const status  = mapState(r.state);
  const overdue = !!(r.scheduleDate && status !== "done" && new Date(r.scheduleDate) < new Date());

  return {
    id:          `#${r.id}`,
    title:       r.name,
    requestedBy: r.createdBy?.name ?? "Unknown",
    status,
    priority:    mapPriority(r.priority),
    dueDate:     formatDate(r.scheduleDate),
    overdue,
    completedOn: status === "done" ? formatDate(r.closeDate) : undefined,
    description: r.description ?? "No description provided.",
    asset:       r.equipment?.name ?? "—",
    location:    r.equipment?.location?.name ?? "—",
    category:    normCategory(r.category?.name),
    assignees:   r.technicians.map((t, i) => ({
      initials: initials(t.name),
      name:     t.name,
      color:    avatarColor(index + i),
    })),
    checklist: [],
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkOrdersPage() {
  const { data, isLoading, isError, refetch } = useGetAllMaintenanceRequestsQuery();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const workOrders: WorkOrder[] = useMemo(
    () => (data?.data.requests ?? []).map((r, i) => toWorkOrder(r, i)),
    [data],
  );

  const effectiveId = selectedId ?? workOrders[0]?.id ?? null;
  const selectedWO  = workOrders.find((wo) => wo.id === effectiveId) ?? null;

  const handleSelect          = useCallback((wo: WorkOrder) => setSelectedId(wo.id), []);
  const handleStatusChange    = useCallback((_id: string, _status: WOStatus) => {}, []);
  const handleChecklistToggle = useCallback((_id: string, _index: number) => {}, []);
  const handleNew             = useCallback(() => console.log("Open new work order form"), []);

  if (isLoading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#F9FAFB", color: "#6B7280", fontSize: 14 }}>
        Loading work orders…
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", alignItems: "center", justifyContent: "center", background: "#F9FAFB", gap: 12 }}>
        <p style={{ color: "#B91C1C", fontSize: 14, margin: 0 }}>Failed to load work orders.</p>
        <button onClick={refetch} style={{ padding: "7px 14px", background: "#2563EB", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, cursor: "pointer" }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F9FAFB" }}>
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
          />
        )}
      </main>
    </div>
  );
}