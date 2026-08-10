"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CardShell } from "../shared/CardShell";
import { Stat } from "../shared/Stat";

import type { StatusBreakdownReport } from "@/redux/Reporting/Reportingapi";
import { STATUS_ORDER } from "../Reporting/reporting.tokens";
import { MAINTENANCE_STATUS_CONFIG } from "@/types/tokens";

// backend returns { new, underRepair, pendingReview, done, cancel, total }
// this maps each token key -> the matching field on that object
const STATUS_VALUE_KEY = {
  new: "new",
  under_repair: "underRepair",
  pending_review: "pendingReview",
  done: "done",
  cancel: "cancel",
} as const;

export function StatusCard({ data }: { data: StatusBreakdownReport }) {
  const donutData = STATUS_ORDER.map(({ key }) => ({
    name: MAINTENANCE_STATUS_CONFIG[key].label,
    value: data[STATUS_VALUE_KEY[key]],
    color: MAINTENANCE_STATUS_CONFIG[key].dot,
  })).filter((d) => d.value > 0);

  return (
    <CardShell title="Status" onAdd>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 130, height: 130, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={62} paddingAngle={2} stroke="none">
                {donutData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E8EAFF" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px", flex: 1 }}>
          {STATUS_ORDER.map(({ key }) => (
            <Stat
              key={key}
              value={data[STATUS_VALUE_KEY[key]]}
              label={MAINTENANCE_STATUS_CONFIG[key].label}
              swatch={MAINTENANCE_STATUS_CONFIG[key].dot}
            />
          ))}
        </div>
      </div>
    </CardShell>
  );
}