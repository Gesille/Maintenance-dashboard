"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CardShell } from "../shared/CardShell";
import { Stat } from "../shared/Stat";
import { formatShortDate } from "../shared/format";

import type { CreatedVsCompletedReport } from "@/redux/Reporting/Reportingapi";
import { INDIGO } from "../Reporting/reporting.tokens";

export function CreatedVsCompletedCard({ data }: { data: CreatedVsCompletedReport }) {
  return (
    <CardShell title="Created VS. Completed" onAdd>
      <div style={{ display: "flex", gap: 26, marginBottom: 8 }}>
        <Stat value={data.created} label="Created" swatch={INDIGO} />
        <Stat value={data.completed} label="Completed" swatch="#22C55E" />
        <Stat value={`${data.percentCompleted}%`} label="Percent Completed" />
      </div>
      <div style={{ height: 140, marginTop: 6 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={INDIGO} stopOpacity={0.25} />
                <stop offset="100%" stopColor={INDIGO} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22C55E" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={28} />
            <Tooltip labelFormatter={(v) => formatShortDate(String(v))} contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E8EAFF" }} />
            <Area type="monotone" dataKey="created" stroke={INDIGO} strokeWidth={2} fill="url(#createdGradient)" />
            <Area type="monotone" dataKey="completed" stroke="#22C55E" strokeWidth={2} fill="url(#completedGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </CardShell>
  );
}