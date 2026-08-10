"use client";
import { CardShell } from "../shared/CardShell";
import { EmptyState } from "../shared/EmptyState";
import { MAINTENANCE_STATUS_CONFIG } from "@/types/tokens";

import type { ActivityRow } from "@/redux/Reporting/Reportingapi";
import { formatRelativeTime } from "@/shared/format";

export function RecentActivityCard({ data, isLoading }: { data: ActivityRow[]; isLoading: boolean }) {
  return (
    <CardShell title="Recent Activity">
      {isLoading ? (
        <EmptyState label="Loading…" />
      ) : data.length === 0 ? (
        <EmptyState label="No activity yet" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {data.map((row, i) => {
            const cfg = MAINTENANCE_STATUS_CONFIG[row.status as keyof typeof MAINTENANCE_STATUS_CONFIG];
            return (
              <div
                key={`${row.id}-${row.actionAt}`}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 4px",
                  borderBottom: i === data.length - 1 ? "none" : "1px solid #F8FAFF",
                }}
              >
                <span
                  style={{
                    width: 8, height: 8, borderRadius: 99, background: cfg?.dot ?? "#94A3B8",
                    marginTop: 5, flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "#0F172A" }}>
                    {row.actionLabel}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {row.name} · {row.equipmentName}
                  </p>
                </div>
                <span style={{ fontSize: 11, color: "#94A3B8", flexShrink: 0, whiteSpace: "nowrap" }}>
                  {formatRelativeTime(row.actionAt)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </CardShell>
  );
}