"use client";
import { CardShell } from "../shared/CardShell";
import { EmptyState } from "../shared/EmptyState";
import type { EquipmentReliabilityRow } from "@/redux/Reporting/Reportingapi";

export function EquipmentReliabilityCard({ data }: { data: EquipmentReliabilityRow[] }) {
  return (
    <CardShell title="Equipment Reliability">
      {data.length === 0 ? (
        <EmptyState label="No equipment requests in range" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.map((row) => (
            <div
              key={row.equipmentId}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F8FAFF" }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: "#0F172A", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {row.name}
                </p>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>
                  {row.restaurant ?? "Unassigned"}
                  {row.assetCode ? ` · ${row.assetCode}` : ""}
                </span>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{row.requestCount}</span>
                <span style={{ fontSize: 10.5, color: "#94A3B8", marginLeft: 4 }}>requests</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}