"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CardShell } from "../shared/CardShell";
import { Stat } from "../shared/Stat";

import { STATUS_CONFIG } from "@/types/tokens";
import type { StatusBreakdownReport } from "@/redux/Reporting/Reportingapi";
import { STATUS_ORDER } from "../Reporting/reporting.tokens";

export function StatusCard({ data }: { data: StatusBreakdownReport }) {
  const donutData = STATUS_ORDER.map(({ key, woKey }) => ({
    name: STATUS_CONFIG[woKey].label,
    value: data[key],
    color: STATUS_CONFIG[woKey].dot,
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
          {STATUS_ORDER.map(({ key, woKey }) => (
            <Stat key={key} value={data[key]} label={STATUS_CONFIG[woKey].label} swatch={STATUS_CONFIG[woKey].dot} />
          ))}
        </div>
      </div>
    </CardShell>
  );
}