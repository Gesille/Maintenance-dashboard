
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { CardShell } from "../shared/CardShell";
import { Stat } from "../shared/Stat";
import { formatHours } from "../shared/format";

import type { AverageResolutionTimeReport } from "@/redux/Reporting/Reportingapi";
import { CHART_PALETTE } from "../Reporting/reporting.tokens";

export function ResolutionTimeCard({
  data,
}: {
  data: AverageResolutionTimeReport;
}) {
  const bars = data.byPriority.map((row, index) => ({
    name: row.priority,
    hours: row.avgHours,
    color: CHART_PALETTE[index % CHART_PALETTE.length],
  }));

  return (
    <CardShell
      title="Avg. Resolution Time (MTTR)"
      subtitle={`${data.resolvedCount} resolved requests`}
      onAdd
    >
      <div
        style={{
          display: "flex",
          gap: 26,
          marginBottom: 8,
          flexWrap: "wrap",
        }}
      >
        <Stat
          value={formatHours(data.avgHours)}
          label="Overall Average"
          swatch={CHART_PALETTE[0]}
        />

        <Stat
          value={data.resolvedCount}
          label="Resolved in range"
        />
      </div>

      {bars.length === 0 ? (
        <div
          style={{
            height: 140,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "#94A3B8",
          }}
        >
          No resolution data available
        </div>
      ) : (
        <div
          style={{
            height: 140,
            marginTop: 6,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={bars}
              margin={{
                top: 4,
                right: 4,
                left: -20,
                bottom: 0,
              }}
              barSize={40}
            >
              <CartesianGrid
                vertical={false}
                stroke="#F1F5F9"
              />

              <XAxis
                dataKey="name"
                tick={{
                  fontSize: 11,
                  fill: "#94A3B8",
                }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{
                  fontSize: 10,
                  fill: "#94A3B8",
                }}
                axisLine={false}
                tickLine={false}
                width={30}
              />

              <Tooltip
                formatter={(value) => formatHours(Number(value))}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 10,
                  border: "1px solid #E8EAFF",
                }}
              />

              <Bar
                dataKey="hours"
                radius={[8, 8, 0, 0]}
              >
                {bars.map((bar) => (
                  <Cell
                    key={bar.name}
                    fill={bar.color}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </CardShell>
  );
}

