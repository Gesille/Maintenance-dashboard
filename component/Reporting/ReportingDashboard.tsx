"use client";
import { useMemo, useRef, useState } from "react";
import { WorkOrderSidebar } from "@/component/Sidebar";


import { ReportingHeader } from "./ReportingHeader";
import { ReportingTabs } from "./ReportingTabs";
import { ReportingFiltersBar } from "./ReportingFiltersBar";
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
  const [exporting, setExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const filters = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - RANGE_OPTIONS[rangeIndex].days);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, [rangeIndex]);

  const { data, isLoading, isFetching } = useGetReportingSummaryQuery(filters);
  const { data: detailRows, isLoading: detailsLoading } = useGetReportingDetailsQuery(filters, {
    skip: activeTab !== "Reporting Details" && activeTab !== "Export Data",
  });
  const { data: activityRows, isLoading: activityLoading } = useGetRecentActivityQuery(undefined, {
    skip: activeTab !== "Recent Activity",
  });

  async function handleExportPdf() {
    if (!contentRef.current) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(contentRef.current, { scale: 2, backgroundColor: "#F8FAFF" });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`reporting-${activeTab.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`);
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
        <ReportingFiltersBar />

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
                    <div key={id} style={{ gridColumn: "1 / -1" }}>
                      {renderCard(id, data)}
                    </div>
                  ) : (
                    <div key={id}>{renderCard(id, data)}</div>
                  ),
                )}
              </div>
            )}

            {activeTab === "Asset Health" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                {ASSET_HEALTH_CARDS.map((id) => (
                  <div key={id}>{renderCard(id, data)}</div>
                ))}
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

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}