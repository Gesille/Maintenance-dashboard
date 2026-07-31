"use client";
import { CardShell } from "../shared/CardShell";
import { EmptyState } from "../shared/EmptyState";
import { PRIORITY_CONFIG } from "@/types/tokens";
import type { OverdueRequestsReport } from "@/redux/Reporting/Reportingapi";

export function OverdueRequestsCard({ data }: { data: OverdueRequestsReport }) {
  return (
    <CardShell title={`Overdue (${data.count})`}>
      {data.requests.length === 0 ? (
        <EmptyState label="Nothing overdue right now" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px 24px" }}>
          {data.requests.slice(0, 8).map((row) => {
            const cfg = PRIORITY_CONFIG[row.priority as keyof typeof PRIORITY_CONFIG];
            return (
              <div key={row.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span
                  style={{
                    fontSize: 12.5, fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap",
                    overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160,
                  }}
                >
                  {row.name}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 10.5, fontWeight: 700, color: cfg?.text ?? "#94A3B8",
                      background: cfg?.bg ?? "#F8FAFF", border: `1px solid ${cfg?.border ?? "#EEF0FF"}`,
                      borderRadius: 6, padding: "2px 7px",
                    }}
                  >
                    {row.priority}
                  </span>
                  <span style={{ fontSize: 11, color: "#EF4444", fontWeight: 600 }}>{row.daysOverdue}d late</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CardShell>
  );
}