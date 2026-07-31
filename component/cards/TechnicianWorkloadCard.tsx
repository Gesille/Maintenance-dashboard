"use client";
import { INDIGO } from "../Reporting/reporting.tokens";
import { CardShell } from "../shared/CardShell";
import { EmptyState } from "../shared/EmptyState";

import type { TechnicianWorkloadRow } from "@/redux/Reporting/Reportingapi";

export function TechnicianWorkloadCard({ data }: { data: TechnicianWorkloadRow[] }) {
  const maxTotal = Math.max(1, ...data.map((r) => r.total));

  return (
    <CardShell title="Technician Workload" onAdd>
      {data.length === 0 ? (
        <EmptyState label="No technician assignments in range" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.map((row) => (
            <div key={row.technicianId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 12, fontWeight: 600, color: "#334155", width: 100, flexShrink: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
              >
                {row.technicianName}
              </span>
              <div style={{ flex: 1, display: "flex", height: 8, borderRadius: 99, background: "#F1F5F9", overflow: "hidden" }}>
                <div style={{ width: `${(row.completed / maxTotal) * 100}%`, background: "#22C55E" }} />
                <div style={{ width: `${(row.open / maxTotal) * 100}%`, background: INDIGO }} />
              </div>
              <span style={{ fontSize: 11.5, color: "#94A3B8", width: 70, textAlign: "right", flexShrink: 0 }}>
                {row.completed}/{row.total} done
              </span>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}