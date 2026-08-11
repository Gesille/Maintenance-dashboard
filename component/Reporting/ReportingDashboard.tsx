"use client";
import { useMemo, useRef, useState } from "react";
import { WorkOrderSidebar } from "@/component/Sidebar";

import { ReportingHeader } from "./ReportingHeader";
import { ReportingTabs } from "./ReportingTabs";
import { ReportingFiltersBar, ReportingFilterState } from "./ReportingFiltersBar";
import { renderCard, FULL_WIDTH_CARDS } from "../cards/CardRenderer";
import { ReportingDetailsTable } from "../cards/ReportingDetailsTable";
import { RecentActivityCard } from "../cards/RecentActivityCard";
import { CustomDashboardsPanel } from "../cards/CustomDashboardsPanel";
import { ExportDataPanel } from "../cards/ExportDataPanel";
import { ChartLoading } from "../shared/ChartLoading";
import { RANGE_OPTIONS, TABS } from "./reporting.tokens";
import { useGetRecentActivityQuery, useGetReportingDetailsQuery, useGetReportingSummaryQuery } from "@/redux/Reporting/Reportingapi";
import { SUMMARY_CARDS, ASSET_HEALTH_CARDS } from "@/types/tokens";

export function ReportingDashboard() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Summary");
  const [rangeIndex, setRangeIndex] = useState(0);
  const [filterState, setFilterState] = useState<ReportingFilterState>({});
  const [exporting, setExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const filters = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - RANGE_OPTIONS[rangeIndex].days);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      priority: filterState.priority,
      technicianId: filterState.technicianId,
      restaurant: filterState.restaurant,
      dueStart: filterState.dueStart ? new Date(filterState.dueStart).toISOString() : undefined,
      dueEnd: filterState.dueEnd ? new Date(filterState.dueEnd).toISOString() : undefined,
    };
  }, [rangeIndex, filterState]);

  const { data, isLoading, isFetching } = useGetReportingSummaryQuery(filters);
  // No longer skipped on other tabs — needed so "Export to PDF" works from any tab
  const { data: detailRows, isLoading: detailsLoading } = useGetReportingDetailsQuery(filters);
  const { data: activityRows, isLoading: activityLoading } = useGetRecentActivityQuery(undefined, {
    skip: activeTab !== "Recent Activity",
  });

  const technicianOptions = useMemo(
    () => (data?.technicianWorkload ?? []).map((t) => ({ id: t.technicianId, name: t.technicianName })),
    [data],
  );
  const locationOptions = useMemo(
    () => (data?.locationBreakdown ?? []).map((l) => l.restaurant),
    [data],
  );

  async function handleExportPdf() {
    if (!data) return;
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const autoTableMod = await import("jspdf-autotable");
      const autoTable = autoTableMod.default;

      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const marginX = 40;
      let y = 50;

      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text("Maintenance Reporting Summary", marginX, y);
      y += 18;
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Range: ${RANGE_OPTIONS[rangeIndex].label} · Generated ${new Date().toLocaleString()}`, marginX, y);
      y += 22;

      autoTable(doc, {
        startY: y,
        head: [["Metric", "Value"]],
        body: [
          ["Created", data.createdVsCompleted.created],
          ["Completed", data.createdVsCompleted.completed],
          ["% Completed", `${data.createdVsCompleted.percentCompleted}%`],
          ["Avg Resolution", `${data.averageResolutionTime.avgHours}h`],
          ["Overdue", data.overdueRequests.count],
          ["Active Asset Value", data.costRollup.activeAssetValue.toLocaleString()],
        ].map(([k, v]) => [String(k), String(v)]),
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
        margin: { left: marginX, right: marginX },
        styles: { fontSize: 9 },
      });
      // @ts-expect-error - jspdf-autotable augments doc at runtime
      y = doc.lastAutoTable.finalY + 20;

      autoTable(doc, {
        startY: y,
        head: [["Status", "Count"]],
        body: [
          ["New", data.statusBreakdown.new],
          ["Under Repair", data.statusBreakdown.underRepair],
          ["Pending Review", data.statusBreakdown.pendingReview],
          ["Done", data.statusBreakdown.done],
          ["Cancelled", data.statusBreakdown.cancel],
        ],
        theme: "striped",
        margin: { left: marginX, right: marginX },
        styles: { fontSize: 9 },
      });
      // @ts-expect-error - jspdf-autotable adds lastAutoTable at runtime
      y = doc.lastAutoTable.finalY + 20;

      autoTable(doc, {
        startY: y,
        head: [["Technician", "Open", "Completed", "Total"]],
        body: data.technicianWorkload.map((t) => [t.technicianName, t.open, t.completed, t.total]),
        theme: "striped",
        margin: { left: marginX, right: marginX },
        styles: { fontSize: 9 },
      });
 // @ts-expect-error - jspdf-autotable adds lastAutoTable at runtime
      y = doc.lastAutoTable.finalY + 20;

      if (detailRows?.length) {
        autoTable(doc, {
          startY: y,
          head: [["Request", "Status", "Priority", "Equipment", "Location", "Created"]],
          body: detailRows.map((r) => [
            r.name, r.status, r.priority, r.equipmentName, r.restaurant ?? "—",
            new Date(r.createdAt).toLocaleDateString(),
          ]),
          theme: "grid",
          margin: { left: marginX, right: marginX },
          styles: { fontSize: 8 },
          headStyles: { fillColor: [139, 92, 246] },
        });
      }

      doc.save(`reporting-${activeTab.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`);
    } catch (err) {
      console.error("[ReportingDashboard] PDF export failed:", err);
      alert("Couldn't generate the PDF. Check the console for details.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFF", fontFamily: "inherit" }}>
      <WorkOrderSidebar />
      <main style={{ flex: 1, minWidth: 0, padding: "24px 28px 40px" }}>
        <ReportingHeader
          rangeLabel={RANGE_OPTIONS[rangeIndex].label}
          onCycleRange={() => setRangeIndex((i) => (i + 1) % RANGE_OPTIONS.length)}
          onExport={handleExportPdf}
          exporting={exporting}
        />
        <ReportingTabs activeTab={activeTab} onChange={setActiveTab} />
        <ReportingFiltersBar
          value={filterState}
          onChange={setFilterState}
          technicianOptions={technicianOptions}
          locationOptions={locationOptions}
        />

        {isFetching && !isLoading && (
          <p style={{ fontSize: 11.5, color: "#A5B4FC", margin: "0 0 10px", fontWeight: 600 }}>Refreshing…</p>
        )}

        {isLoading || !data ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #EEF0FF", borderRadius: 16, padding: 20 }}>
                <ChartLoading />
              </div>
            ))}
          </div>
        ) : (
          <div ref={contentRef}>
            {activeTab === "Summary" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                {SUMMARY_CARDS.map((id) =>
                  FULL_WIDTH_CARDS.includes(id) ? (
                    <div key={id} style={{ gridColumn: "1 / -1" }}>{renderCard(id, data)}</div>
                  ) : (
                    <div key={id}>{renderCard(id, data)}</div>
                  ),
                )}
              </div>
            )}
            {activeTab === "Asset Health" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                {ASSET_HEALTH_CARDS.map((id) => <div key={id}>{renderCard(id, data)}</div>)}
              </div>
            )}
            {activeTab === "Reporting Details" && (
              <ReportingDetailsTable data={detailRows ?? []} isLoading={detailsLoading} />
            )}
            {activeTab === "Recent Activity" && (
              <RecentActivityCard data={activityRows ?? []} isLoading={activityLoading} />
            )}
            {activeTab === "Export Data" && (
              <ExportDataPanel summary={data} details={detailRows ?? []} onExportPdf={handleExportPdf} />
            )}
            {activeTab === "Custom Dashboards" && <CustomDashboardsPanel data={data} />}
          </div>
        )}
      </main>
    </div>
  );
}