"use client";
import { INDIGO, VIOLET } from "../Reporting/reporting.tokens";
import { CardShell } from "../shared/CardShell";
import { Stat } from "../shared/Stat";
import { formatCurrency } from "../shared/format";

import type { CostRollupReport } from "@/redux/Reporting/Reportingapi";

export function CostRollupCard({ data }: { data: CostRollupReport }) {
  const pctActive = data.totalAssetValue > 0 ? Math.round((data.activeAssetValue / data.totalAssetValue) * 100) : 0;

  return (
    <CardShell title="Asset Value In Maintenance">
      <div style={{ display: "flex", gap: 26, marginBottom: 12 }}>
        <Stat value={formatCurrency(data.activeAssetValue)} label={`In shop (${data.activeEquipmentCount})`} swatch={INDIGO} />
        <Stat value={formatCurrency(data.totalAssetValue)} label={`Fleet total (${data.totalEquipmentCount})`} swatch={VIOLET} />
      </div>
      <div style={{ height: 8, borderRadius: 99, background: "#F1F5F9", overflow: "hidden" }}>
        <div style={{ width: `${pctActive}%`, height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${INDIGO}, ${VIOLET})` }} />
      </div>
      <span style={{ fontSize: 11, color: "#94A3B8", marginTop: 6, display: "inline-block" }}>
        {pctActive}% of fleet value currently tied up in active maintenance
      </span>
    </CardShell>
  );
}