"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CardShell } from "../shared/CardShell";
import { Stat } from "../shared/Stat";
import { formatHours } from "../shared/format";

import type { AverageResolutionTimeReport } from "@/redux/Reporting/Reportingapi";
import { CHART_PALETTE } from "../Reporting/reporting.tokens";

export function ResolutionTimeCard({ data }: { data: AverageResolutionTimeReport }) {
  const bars = data.byPriority.map((r, i) => ({
    name: r.priority,
    hours: r.avgHours,
    color: CHART_PALETTE[i % CHART_PALETTE.length],
  }));

  return (
    <CardShell title="Avg. Resolution Time (MTTR)" onAdd>
      <div style={{ display: "flex", gap: 26, marginBottom: 8 }}>
        <Stat value={formatHours(data.avgHours)} label="Overall Average" swatch={CHART_PALETTE[0]} />
        <Stat value={data.resolvedCount} label="Resolved in range" />
      </div>
      <div style={{ height: 140, marginTop: 6 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={40}>
            <CartesianGrid vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={30} />
           <Tooltip
  formatter={(v) => formatHours(Number(v))}
  contentStyle={{
    fontSize: 12,
    borderRadius: 10,
    border: "1px solid #E8EAFF",
  }}
/>
            <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
              {bars.map((b) => (
                <Cell key={b.name} fill={b.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardShell>
  );
}