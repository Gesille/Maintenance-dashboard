"use client";
import { CardShell } from "../shared/CardShell";
import { Stat } from "../shared/Stat";

import { PRIORITY_CONFIG } from "@/types/tokens";
import type { PriorityBreakdownRow } from "@/redux/Reporting/Reportingapi";
import { PRIORITY_LABEL } from "../Reporting/reporting.tokens";

export function PriorityCard({ data }: { data: PriorityBreakdownRow[] }) {
  const total = data.reduce((sum, r) => sum + r.count, 0) || 1;
  return (
    <CardShell title="Priority" onAdd>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
          {data.map((row) => {
            const cfg = PRIORITY_CONFIG[row.priority as keyof typeof PRIORITY_CONFIG];
            return (
              <Stat key={row.priority} value={row.count} label={PRIORITY_LABEL[row.priority] ?? row.priority} swatch={cfg?.text ?? "#94A3B8"} />
            );
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          {data.map((row) => {
            const cfg = PRIORITY_CONFIG[row.priority as keyof typeof PRIORITY_CONFIG];
            const pct = Math.round((row.count / total) * 100);
            return (
              <div key={row.priority} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11.5, color: "#64748B", width: 60, flexShrink: 0 }}>
                  {PRIORITY_LABEL[row.priority] ?? row.priority}
                </span>
                <div style={{ flex: 1, height: 8, borderRadius: 99, background: "#F1F5F9", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 99, background: cfg?.text ?? "#94A3B8" }} />
                </div>
                <span style={{ fontSize: 11.5, color: "#94A3B8", width: 30, textAlign: "right", flexShrink: 0 }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </CardShell>
  );
}