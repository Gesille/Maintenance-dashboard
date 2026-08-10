"use client";
import { useState } from "react";
import { FileDown, FileSpreadsheet, FileJson } from "lucide-react";
import { CardShell } from "../shared/CardShell";

import type { ReportingSummary, RequestDetailRow } from "@/redux/Reporting/Reportingapi";
import { downloadFile, toCsv } from "@/shared/format";

export function ExportDataPanel({
  summary,
  details,
  onExportPdf,
}: {
  summary: ReportingSummary;
  details: RequestDetailRow[];
  onExportPdf: () => Promise<void>;
}) {
  const [exportingPdf, setExportingPdf] = useState(false);

  function exportSummaryCsv() {
    const rows = [
      { metric: "Created", value: summary.createdVsCompleted.created },
      { metric: "Completed", value: summary.createdVsCompleted.completed },
      { metric: "Reactive", value: summary.reactiveVsRepeatable.reactive },
      { metric: "Repeatable", value: summary.reactiveVsRepeatable.repeatable },
      { metric: "New", value: summary.statusBreakdown.new },
      { metric: "Under Repair", value: summary.statusBreakdown.underRepair },
      { metric: "Pending Review", value: summary.statusBreakdown.pendingReview },
      { metric: "Done", value: summary.statusBreakdown.done },
      { metric: "Cancelled", value: summary.statusBreakdown.cancel },
      { metric: "Avg Resolution (hrs)", value: summary.averageResolutionTime.avgHours },
      { metric: "Active Asset Value", value: summary.costRollup.activeAssetValue },
      { metric: "Total Asset Value", value: summary.costRollup.totalAssetValue },
      { metric: "Overdue Count", value: summary.overdueRequests.count },
    ];
    downloadFile(`reporting-summary-${Date.now()}.csv`, toCsv(rows), "text/csv");
  }

  function exportDetailsCsv() {
    if (details.length === 0) return;
    const rows = details.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      priority: r.priority,
      equipment: r.equipmentName,
      location: r.restaurant ?? "",
      category: r.category ?? "",
      reportedBy: r.reportedBy,
      technicians: r.technicianNames.join("; "),
      createdAt: r.createdAt,
      closeDate: r.closeDate ?? "",
    }));
    downloadFile(`reporting-details-${Date.now()}.csv`, toCsv(rows), "text/csv");
  }

  function exportJson() {
    downloadFile(
      `reporting-summary-${Date.now()}.json`,
      JSON.stringify(summary, null, 2),
      "application/json",
    );
  }

  async function handlePdf() {
    setExportingPdf(true);
    try {
      await onExportPdf();
    } finally {
      setExportingPdf(false);
    }
  }

  const buttonStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
    padding: "14px 16px", borderRadius: 12, border: "1px solid #E2E8F0", background: "#fff",
    cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#0F172A",
  };

  return (
    <CardShell title="Export Data">
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 420 }}>
        <button style={buttonStyle} onClick={handlePdf} disabled={exportingPdf}>
          <FileDown size={16} color="#6366F1" />
          {exportingPdf ? "Generating PDF…" : "Export current view as PDF"}
        </button>
        <button style={buttonStyle} onClick={exportSummaryCsv}>
          <FileSpreadsheet size={16} color="#22C55E" />
          Export summary metrics as CSV
        </button>
        <button style={buttonStyle} onClick={exportDetailsCsv} disabled={details.length === 0}>
          <FileSpreadsheet size={16} color="#22C55E" />
          Export full request list as CSV ({details.length})
        </button>
        <button style={buttonStyle} onClick={exportJson}>
          <FileJson size={16} color="#F97316" />
          Export raw summary as JSON
        </button>
      </div>
    </CardShell>
  );
}