"use client";
import { CHART_PALETTE } from "../Reporting/reporting.tokens";
import { CardShell } from "../shared/CardShell";
import { EmptyState } from "../shared/EmptyState";

import type { LocationBreakdownRow } from "@/redux/Reporting/Reportingapi";

export function LocationBreakdownCard({ data }: { data: LocationBreakdownRow[] }) {
  const total = data.reduce((sum, r) => sum + r.count, 0) || 1;

  return (
    <CardShell title="By Location">
      {data.length === 0 ? (
        <EmptyState label="No location data in range" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.map((row, i) => {
            const pct = Math.round((row.count / total) * 100);
            return (
              <div key={row.restaurant} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    fontSize: 11.5, color: "#64748B", width: 100, flexShrink: 0,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}
                >
                  {row.restaurant}
                </span>
                <div style={{ flex: 1, height: 8, borderRadius: 99, background: "#F1F5F9", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: CHART_PALETTE[i % CHART_PALETTE.length] }} />
                </div>
                <span style={{ fontSize: 11.5, color: "#94A3B8", width: 46, textAlign: "right", flexShrink: 0 }}>
                  {row.count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      )}
    </CardShell>
  );
}