"use client";

import type { ReportingSummary } from "@/redux/Reporting/Reportingapi";

import { CategoryBreakdownCard } from "./CategoryBreakdownCard";
import { CostRollupCard } from "./CostRollupCard";
import { CreatedVsCompletedCard } from "./CreatedVsCompletedCard";
import { EquipmentReliabilityCard } from "./EquipmentReliabilityCard";
import { LocationBreakdownCard } from "./LocationBreakdownCard";
import { OverdueRequestsCard } from "./OverdueRequestsCard";
import { PriorityCard } from "./PriorityCard";
import { ReactiveVsRepeatableCard } from "./ReactiveVsRepeatableCard";
import { ResolutionTimeCard } from "./ResolutionTimeCard";
import { StatusCard } from "./StatusCard";
import { TechnicianWorkloadCard } from "./TechnicianWorkloadCard";
import { CardId } from "@/types/tokens";

export function renderCard(id: CardId, data: ReportingSummary) {
  switch (id) {
    case "createdVsCompleted":
      return <CreatedVsCompletedCard data={data.createdVsCompleted} />;
    case "reactiveVsRepeatable":
      return <ReactiveVsRepeatableCard data={data.reactiveVsRepeatable} />;
    case "status":
      return <StatusCard data={data.statusBreakdown} />;
    case "priority":
      return <PriorityCard data={data.priorityBreakdown} />;
    case "resolutionTime":
      return <ResolutionTimeCard data={data.averageResolutionTime} />;
    case "costRollup":
      return <CostRollupCard data={data.costRollup} />;
    case "technicianWorkload":
      return <TechnicianWorkloadCard data={data.technicianWorkload} />;
    case "equipmentReliability":
      return <EquipmentReliabilityCard data={data.equipmentReliability} />;
    case "locationBreakdown":
      return <LocationBreakdownCard data={data.locationBreakdown} />;
    case "categoryBreakdown":
      return <CategoryBreakdownCard data={data.categoryBreakdown} />;
    case "overdue":
      return <OverdueRequestsCard data={data.overdueRequests} />;
    default:
      return null;
  }
}

// Cards that span the full grid width rather than sitting in the 2-col grid
export const FULL_WIDTH_CARDS: CardId[] = ["overdue"];