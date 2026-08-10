
"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { CardShell } from "../shared/CardShell";
import { Stat } from "../shared/Stat";
import { formatShortDate } from "../shared/format";
import type { CreatedVsCompletedReport } from "@/redux/Reporting/Reportingapi";
import { INDIGO } from "../Reporting/reporting.tokens";

export function CreatedVsCompletedCard({
  data,
}: {
  data: CreatedVsCompletedReport;
}) {
  return (
    <CardShell title="Created vs Completed">
      <div
        style={{
          display: "flex",
          gap: 26,
          marginBottom: 8,
        }}
      >
        <Stat
          value={`${data.percentCompleted}%`}
          label="Percent Completed"
          swatch={INDIGO}
        />
      </div>

      <div
        style={{
          height: 140,
          marginTop: 6,
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data.series}
            margin={{
              top: 4,
              right: 4,
              left: -20,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="createdCompletedGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={INDIGO}
                  stopOpacity={0.25}
                />
                <stop
                  offset="100%"
                  stopColor={INDIGO}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="#F1F5F9"
            />

            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              tick={{
                fontSize: 10,
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
              width={28}
            />

            <Tooltip
              labelFormatter={(value) =>
                formatShortDate(String(value))
              }
              contentStyle={{
                fontSize: 12,
                borderRadius: 10,
                border: "1px solid #E8EAFF",
              }}
            />

            <Area
              type="monotone"
              dataKey="created"
              stroke={INDIGO}
              strokeWidth={2}
              fill="url(#createdCompletedGradient)"
              name="Created"
            />

            <Area
              type="monotone"
              dataKey="completed"
              stroke="#22C55E"
              strokeWidth={2}
              fill="none"
              name="Completed"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </CardShell>
  );
}

