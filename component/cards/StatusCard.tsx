
"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { CardShell } from "../shared/CardShell";
import { Stat } from "../shared/Stat";
import type { StatusBreakdownReport } from "@/redux/Reporting/Reportingapi";
import { MAINTENANCE_STATUS_CONFIG } from "@/types/tokens";

const STATUS_ORDER = [
  "new",
  "under_repair",
  "pending_review",
  "done",
  "cancel",
] as const;

const STATUS_VALUE_KEY = {
  new: "new",
  under_repair: "underRepair",
  pending_review: "pendingReview",
  done: "done",
  cancel: "cancel",
} as const;

export function StatusCard({
  data,
}: {
  data: StatusBreakdownReport;
}) {
  const donutData = STATUS_ORDER
    .map((key) => {
      const config = MAINTENANCE_STATUS_CONFIG[key];

      return {
        name: config.label,
        value: data[STATUS_VALUE_KEY[key]] ?? 0,
        color: config.dot,
      };
    })
    .filter((item) => item.value > 0);

  return (
    <CardShell
      title="Status"
      subtitle={`${data.total} total requests`}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            width: 130,
            height: 130,
            flexShrink: 0,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={58}
                paddingAngle={2}
                stroke="none"
              >
                {donutData.map((entry, index) => (
                  <Cell
                    key={`status-cell-${index}`}
                    fill={entry.color}
                  />
                ))}
              </Pie>

              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 10,
                  border: "1px solid #E8EAFF",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px 20px",
            flex: 1,
          }}
        >
          {STATUS_ORDER.map((key) => {
            const config = MAINTENANCE_STATUS_CONFIG[key];

            return (
              <Stat
                key={key}
                value={data[STATUS_VALUE_KEY[key]] ?? 0}
                label={config.label}
                swatch={config.dot}
              />
            );
          })}
        </div>
      </div>
    </CardShell>
  );
}

