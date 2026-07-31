"use client";
import { useMemo, useState } from "react";
import { WorkOrderSidebar } from "@/component/Sidebar";
import { useGetReportingSummaryQuery } from "@/redux/Reporting/Reportingapi";
import { RANGE_OPTIONS, TABS } from "./reporting.tokens";
import { ReportingHeader } from "./ReportingHeader";
import { ReportingTabs } from "./ReportingTabs";
import { ReportingFiltersBar } from "./ReportingFiltersBar";
import { CategoryBreakdownCard } from "../cards/CategoryBreakdownCard";
import { CostRollupCard } from "../cards/CostRollupCard";
import { CreatedVsCompletedCard } from "../cards/CreatedVsCompletedCard";
import { EquipmentReliabilityCard } from "../cards/EquipmentReliabilityCard";
import { LocationBreakdownCard } from "../cards/LocationBreakdownCard";
import { OverdueRequestsCard } from "../cards/OverdueRequestsCard";
import { PriorityCard } from "../cards/PriorityCard";
import { ReactiveVsRepeatableCard } from "../cards/ReactiveVsRepeatableCard";
import { ResolutionTimeCard } from "../cards/ResolutionTimeCard";
import { StatusCard } from "../cards/StatusCard";
import { TechnicianWorkloadCard } from "../cards/TechnicianWorkloadCard";
import { ChartLoading } from "../shared/ChartLoading";


export function ReportingDashboard() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Summary");
  const [rangeIndex, setRangeIndex] = useState(0);

  const filters = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - RANGE_OPTIONS[rangeIndex].days);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, [rangeIndex]);

  const { data, isLoading, isFetching } = useGetReportingSummaryQuery(filters);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFF", fontFamily: "inherit" }}>
      <WorkOrderSidebar />

      <main style={{ flex: 1, minWidth: 0, padding: "24px 28px 40px" }}>
        <ReportingHeader
          rangeLabel={RANGE_OPTIONS[rangeIndex].label}
          onCycleRange={() => setRangeIndex((i) => (i + 1) % RANGE_OPTIONS.length)}
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <CreatedVsCompletedCard data={data.createdVsCompleted} />
            <ReactiveVsRepeatableCard data={data.reactiveVsRepeatable} />
            <StatusCard data={data.statusBreakdown} />
            <PriorityCard data={data.priorityBreakdown} />
            <ResolutionTimeCard data={data.averageResolutionTime} />
            <CostRollupCard data={data.costRollup} />
            <TechnicianWorkloadCard data={data.technicianWorkload} />
            <EquipmentReliabilityCard data={data.equipmentReliability} />
            <LocationBreakdownCard data={data.locationBreakdown} />
            <CategoryBreakdownCard data={data.categoryBreakdown} />
            <div style={{ gridColumn: "1 / -1" }}>
              <OverdueRequestsCard data={data.overdueRequests} />
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}