/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Building2,
  Download,
  UserPlus,
  CalendarDays,
  MapPin,
  Flag,
  Plus,
  Star,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { WorkOrderSidebar } from "@/component/Sidebar";
import { useGetReportingSummaryQuery } from "@/redux/Reporting/Reportingapi";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/types/tokens";

// ─── Local config ─────────────────────────────────────────────────────────────

const TABS = [
  "Summary",
  "Asset Health",
  "Reporting Details",
  "Recent Activity",
  "Export Data",
  "Custom Dashboards",
] as const;

const RANGE_OPTIONS = [
  { label: "Last 7 days", days: 7 },
  { label: "Weekly Reports", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
] as const;

const INDIGO = "#6366F1";
const VIOLET = "#8B5CF6";

const STATUS_ORDER: Array<{ key: "open" | "inProgress" | "onHold" | "done"; woKey: keyof typeof STATUS_CONFIG }> = [
  { key: "open", woKey: "open" },
  { key: "onHold", woKey: "on_hold" },
  { key: "inProgress", woKey: "in_progress" },
  { key: "done", woKey: "done" },
];

const PRIORITY_LABEL: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "None",
};

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ─── Small building blocks ────────────────────────────────────────────────────

function CardShell({
  title,
  children,
  onAdd,
}: {
  title: string;
  children: React.ReactNode;
  onAdd?: boolean;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #EEF0FF",
        borderRadius: 16,
        padding: "18px 20px 20px",
        boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>
            {title}
          </span>
          <ChevronDown size={14} color="#94A3B8" />
        </div>
        {onAdd && (
          <button
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              border: "1px solid #E8EAFF",
              background: "#FAFBFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#6366F1",
            }}
            aria-label={`Add to ${title}`}
          >
            <Plus size={14} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Stat({
  value,
  label,
  swatch,
}: {
  value: string | number;
  label: string;
  swatch?: string;
}) {
  return (
    <div>
      <p style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>
        {value}
      </p>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          fontWeight: 600,
          color: "#64748B",
          background: "#F8FAFF",
          border: "1px solid #EEF0FF",
          borderRadius: 6,
          padding: "3px 8px",
          marginTop: 6,
        }}
      >
        {swatch && (
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: swatch, flexShrink: 0 }} />
        )}
        {label}
      </span>
    </div>
  );
}

function FilterChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12.5,
        fontWeight: 500,
        color: "#475569",
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: 9,
        padding: "7px 12px",
        cursor: "pointer",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function ChartLoading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 150, color: "#C7D2FE" }}>
      <Loader2 size={20} className="spin" style={{ animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportingPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Summary");
  const [rangeIndex, setRangeIndex] = useState(0);

  const filters = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - RANGE_OPTIONS[rangeIndex].days);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, [rangeIndex]);

  const { data, isLoading, isFetching } = useGetReportingSummaryQuery(filters);

  const priorityTotal = useMemo(
    () => (data?.priorityBreakdown ?? []).reduce((sum, r) => sum + r.count, 0) || 1,
    [data],
  );

  const donutData = useMemo(() => {
    if (!data) return [];
    return STATUS_ORDER.map(({ key, woKey }) => ({
      name: STATUS_CONFIG[woKey].label,
      value: data.statusBreakdown[key],
      color: STATUS_CONFIG[woKey].dot,
    })).filter((d) => d.value > 0);
  }, [data]);

  const reactiveVsRepeatableBars = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Reactive", value: data.reactiveVsRepeatable.reactive, color: INDIGO },
      { name: "Repeatable", value: data.reactiveVsRepeatable.repeatable, color: VIOLET },
    ];
  }, [data]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFF", fontFamily: "inherit" }}>
      <WorkOrderSidebar />

      <main style={{ flex: 1, minWidth: 0, padding: "24px 28px 40px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>
              Reporting
            </h1>
            <button
              onClick={() => setRangeIndex((i) => (i + 1) % RANGE_OPTIONS.length)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
                fontWeight: 600,
                color: "#6366F1",
                background: "#EEF2FF",
                border: "1px solid #E0E7FF",
                borderRadius: 8,
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              {RANGE_OPTIONS[rangeIndex].label}
              <ChevronDown size={13} />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 12.5,
                fontWeight: 600,
                color: "#475569",
                background: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: 10,
                padding: "9px 14px",
                cursor: "pointer",
              }}
            >
              <Building2 size={14} />
              Organization
            </button>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 12.5,
                fontWeight: 700,
                color: "#fff",
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                border: "none",
                borderRadius: 10,
                padding: "9px 16px",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
              }}
            >
              <Download size={14} />
              Export to PDF
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 22, borderBottom: "1px solid #E8EAFF", marginBottom: 18 }}>
          {TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0 0 11px",
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#4F46E5" : "#94A3B8",
                  borderBottom: active ? "2px solid #6366F1" : "2px solid transparent",
                  letterSpacing: "-0.01em",
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <FilterChip icon={<UserPlus size={13.5} />} label="Assigned to" />
            <FilterChip icon={<CalendarDays size={13.5} />} label="Due Date" />
            <FilterChip icon={<MapPin size={13.5} />} label="Location" />
            <FilterChip icon={<Flag size={13.5} />} label="Priority" />
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12.5,
                fontWeight: 600,
                color: "#6366F1",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "7px 4px",
              }}
            >
              <Plus size={14} />
              Add filter
            </button>
          </div>

          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12.5,
              fontWeight: 600,
              color: "#475569",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Star size={14} color="#C7D2FE" />
            My Filters
          </button>
        </div>

        {isFetching && !isLoading && (
          <p style={{ fontSize: 11.5, color: "#A5B4FC", margin: "0 0 10px", fontWeight: 600 }}>Refreshing…</p>
        )}

        {/* Card grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {/* Created vs Completed */}
          <CardShell title="Created VS. Completed" onAdd>
            {isLoading || !data ? (
              <ChartLoading />
            ) : (
              <>
                <div style={{ display: "flex", gap: 26, marginBottom: 8 }}>
                  <Stat value={data.createdVsCompleted.created} label="Created" swatch={INDIGO} />
                  <Stat value={data.createdVsCompleted.completed} label="Completed" swatch="#22C55E" />
                  <Stat value={`${data.createdVsCompleted.percentCompleted}%`} label="Percent Completed" />
                </div>
                <div style={{ height: 140, marginTop: 6 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.createdVsCompleted.series} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={INDIGO} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={INDIGO} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22C55E" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#F1F5F9" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatShortDate}
                        tick={{ fontSize: 10, fill: "#94A3B8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip
                        labelFormatter={(v) => formatShortDate(String(v))}
                        contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E8EAFF" }}
                      />
                      <Area type="monotone" dataKey="created" stroke={INDIGO} strokeWidth={2} fill="url(#createdGradient)" />
                      <Area type="monotone" dataKey="completed" stroke="#22C55E" strokeWidth={2} fill="url(#completedGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </CardShell>

          {/* Reactive vs Repeatable */}
          <CardShell title="Repeatable VS. Reactive" onAdd>
            {isLoading || !data ? (
              <ChartLoading />
            ) : (
              <>
                <div style={{ display: "flex", gap: 26, marginBottom: 8 }}>
                  <Stat value={data.reactiveVsRepeatable.reactive} label="Total Reactive" swatch={INDIGO} />
                  <Stat value={data.reactiveVsRepeatable.repeatable} label="Total Repeatable" swatch={VIOLET} />
                </div>
                <div style={{ height: 140, marginTop: 6 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reactiveVsRepeatableBars} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={54}>
                      <CartesianGrid vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E8EAFF" }} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {reactiveVsRepeatableBars.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </CardShell>

          {/* Status */}
          <CardShell title="Status" onAdd>
            {isLoading || !data ? (
              <ChartLoading />
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ width: 130, height: 130, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={40}
                        outerRadius={62}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {donutData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E8EAFF" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px", flex: 1 }}>
                  {STATUS_ORDER.map(({ key, woKey }) => (
                    <Stat
                      key={key}
                      value={data.statusBreakdown[key]}
                      label={STATUS_CONFIG[woKey].label}
                      swatch={STATUS_CONFIG[woKey].dot}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardShell>

          {/* Priority */}
          <CardShell title="Priority" onAdd>
            {isLoading || !data ? (
              <ChartLoading />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
                  {data.priorityBreakdown.map((row) => {
                    const cfg = PRIORITY_CONFIG[row.priority as keyof typeof PRIORITY_CONFIG];
                    return (
                      <Stat
                        key={row.priority}
                        value={row.count}
                        label={PRIORITY_LABEL[row.priority] ?? row.priority}
                        swatch={cfg?.text ?? "#94A3B8"}
                      />
                    );
                  })}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                  {data.priorityBreakdown.map((row) => {
                    const cfg = PRIORITY_CONFIG[row.priority as keyof typeof PRIORITY_CONFIG];
                    const pct = Math.round((row.count / priorityTotal) * 100);
                    return (
                      <div key={row.priority} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 11.5, color: "#64748B", width: 60, flexShrink: 0 }}>
                          {PRIORITY_LABEL[row.priority] ?? row.priority}
                        </span>
                        <div style={{ flex: 1, height: 8, borderRadius: 99, background: "#F1F5F9", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              borderRadius: 99,
                              background: cfg?.text ?? "#94A3B8",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11.5, color: "#94A3B8", width: 30, textAlign: "right", flexShrink: 0 }}>
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardShell>
        </div>
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}