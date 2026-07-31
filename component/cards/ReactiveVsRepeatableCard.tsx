"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CardShell } from "../shared/CardShell";
import { Stat } from "../shared/Stat";

import type { ReactiveVsRepeatableReport } from "@/redux/Reporting/Reportingapi";
import { INDIGO, VIOLET } from "../Reporting/reporting.tokens";

export function ReactiveVsRepeatableCard({ data }: { data: ReactiveVsRepeatableReport }) {
  const bars = [
    { name: "Reactive", value: data.reactive, color: INDIGO },
    { name: "Repeatable", value: data.repeatable, color: VIOLET },
  ];
  return (
    <CardShell title="Repeatable VS. Reactive" onAdd>
      <div style={{ display: "flex", gap: 26, marginBottom: 8 }}>
        <Stat value={data.reactive} label="Total Reactive" swatch={INDIGO} />
        <Stat value={data.repeatable} label="Total Repeatable" swatch={VIOLET} />
      </div>
      <div style={{ height: 140, marginTop: 6 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={54}>
            <CartesianGrid vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E8EAFF" }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {bars.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardShell>
  );
}