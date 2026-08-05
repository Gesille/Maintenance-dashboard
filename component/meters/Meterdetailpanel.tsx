"use client";

import { useMemo, useState } from "react";
import { Meter, MeterTrigger, useGetMeterChartDataQuery, useGetMeterReadingHistoryQuery } from "@/redux/Meter/Meterapi";

import { PRIORITY_CONFIG } from "@/types/tokens";
import { MeterReadingChart } from "./Meterreadingchart";
import { TRIGGER_OPERATOR_LABELS, METER_STATUS_CONFIG, METER_TYPE_LABELS, READING_TYPE_LABELS } from "@/types/Metertokens";

interface Props {
  meter: Meter;
  onRecordReading: () => void;
  onAddTrigger: () => void;
  onEditTrigger: (trigger: MeterTrigger) => void;
  onDeleteTrigger: (triggerId: string) => void;
  deletingTriggerId?: string | null;
}

const RANGE_OPTIONS = [
  { key: "7", label: "7d" },
  { key: "30", label: "30d" },
  { key: "90", label: "90d" },
  { key: "all", label: "All" },
] as const;

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function describeTrigger(t: MeterTrigger, unit: string): string {
  if (t.operator === "between") {
    return `Between ${t.value} and ${t.valueMax ?? "?"} ${unit}`;
  }
  if (t.operator === "increased_by") {
    return `Increases by ${t.value} ${unit} since last reading`;
  }
  return `${TRIGGER_OPERATOR_LABELS[t.operator]} ${t.value} ${unit}`;
}

export function MeterDetailPanel({
  meter,
  onRecordReading,
  onAddTrigger,
  onEditTrigger,
  onDeleteTrigger,
  deletingTriggerId,
}: Props) {
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]["key"]>("30");
  const cfg = METER_STATUS_CONFIG[meter.status];

  const { startDate, endDate } = useMemo(() => {
    if (range === "all") return { startDate: undefined, endDate: undefined };
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - Number(range));
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, [range]);

  const { data: chartData } = useGetMeterChartDataQuery({ id: meter.id, startDate, endDate });
  const { data: historyData } = useGetMeterReadingHistoryQuery({ id: meter.id, limit: 15 });

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#F8FAFF" }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "28px 32px 60px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 700,
                background: cfg.bg,
                color: cfg.text,
                border: `1px solid ${cfg.border}`,
                marginBottom: 10,
              }}
            >
              <i className={`ti ${cfg.icon}`} style={{ fontSize: 12 }} aria-hidden="true" />
              {cfg.label}
            </span>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>
              {meter.name}
            </h1>
            <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>
              <i className="ti ti-building-factory-2" style={{ fontSize: 12, marginRight: 4 }} aria-hidden="true" />
              {meter.equipmentName ?? "Unlinked equipment"}
            </p>
          </div>

          <button
            onClick={onRecordReading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 18px",
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              color: "#fff",
              border: "none",
              borderRadius: 11,
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 6px 16px rgba(99,102,241,0.32)",
              whiteSpace: "nowrap",
            }}
          >
            <i className="ti ti-gauge" style={{ fontSize: 14 }} aria-hidden="true" />
            Record reading
          </button>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            {
              label: "Last reading",
              value: meter.lastReadingValue !== null ? `${meter.lastReadingValue} ${meter.unit}` : "—",
              icon: "ti-chart-line",
            },
            { label: "Recorded", value: formatDateTime(meter.lastReadingAt), icon: "ti-clock" },
            { label: "Meter type", value: METER_TYPE_LABELS[meter.meterType], icon: "ti-plug" },
            { label: "Reading type", value: READING_TYPE_LABELS[meter.readingType], icon: "ti-arrows-diff" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "#fff",
                border: "1px solid #EEF0F4",
                borderRadius: 14,
                padding: "14px 16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <i className={`ti ${stat.icon}`} style={{ fontSize: 13, color: "#8B5CF6" }} aria-hidden="true" />
                <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  {stat.label}
                </span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {meter.description && (
          <p style={{ fontSize: 13.5, color: "#4B5563", lineHeight: 1.6, margin: "0 0 24px" }}>{meter.description}</p>
        )}

        {/* Chart */}
        <div style={{ background: "#fff", border: "1px solid #EEF0F4", borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>Readings</h2>
            <div style={{ display: "flex", gap: 4 }}>
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 7,
                    fontSize: 11.5,
                    fontWeight: 600,
                    border: range === r.key ? "1px solid #6366F1" : "1px solid #E5E7EB",
                    background: range === r.key ? "#EEF2FF" : "#fff",
                    color: range === r.key ? "#4338CA" : "#6B7280",
                    cursor: "pointer",
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <MeterReadingChart points={chartData?.data ?? []} unit={meter.unit} />
        </div>

        {/* Triggers */}
        <div style={{ background: "#fff", border: "1px solid #EEF0F4", borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>Work order triggers</h2>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: "3px 0 0" }}>
                A reading that matches an active trigger opens a work order automatically.
              </p>
            </div>
            <button
              onClick={onAddTrigger}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 12px",
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 600,
                border: "1px solid #E5E7EB",
                background: "#fff",
                color: "#4338CA",
                cursor: "pointer",
              }}
            >
              <i className="ti ti-plus" style={{ fontSize: 12 }} aria-hidden="true" />
              Add trigger
            </button>
          </div>

          {meter.triggers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#9CA3AF", fontSize: 13 }}>
              No triggers set — readings on this meter won&apos;t open work orders automatically.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {meter.triggers.map((t) => {
                const pcfg = PRIORITY_CONFIG[(t.workOrderPriority as keyof typeof PRIORITY_CONFIG) ?? "medium"];
                return (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: "1px solid #F0F0F2",
                      opacity: t.active ? 1 : 0.55,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{t.label}</span>
                        {pcfg && (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: "1px 7px",
                              borderRadius: 999,
                              background: pcfg.bg,
                              color: pcfg.text,
                              border: `1px solid ${pcfg.border}`,
                            }}
                          >
                            {pcfg.label}
                          </span>
                        )}
                        {!t.active && (
                          <span style={{ fontSize: 10.5, color: "#9CA3AF", fontWeight: 600 }}>Inactive</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>
                        When reading {describeTrigger(t, meter.unit)}
                        {t.assignTechnicians.length > 0 &&
                          ` → assigns ${t.assignTechnicians.map((a) => a.name).join(", ")}`}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => onEditTrigger(t)}
                        aria-label={`Edit trigger ${t.label}`}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          border: "1px solid #E5E7EB",
                          background: "#fff",
                          color: "#6B7280",
                          cursor: "pointer",
                        }}
                      >
                        <i className="ti ti-pencil" style={{ fontSize: 13 }} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => onDeleteTrigger(t.id)}
                        disabled={deletingTriggerId === t.id}
                        aria-label={`Remove trigger ${t.label}`}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          border: "1px solid #FECACA",
                          background: "#fff",
                          color: "#DC2626",
                          cursor: deletingTriggerId === t.id ? "wait" : "pointer",
                        }}
                      >
                        <i className="ti ti-trash" style={{ fontSize: 13 }} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reading history */}
        <div style={{ background: "#fff", border: "1px solid #EEF0F4", borderRadius: 16, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 14px" }}>Reading history</h2>

          {(!historyData || historyData.data.length === 0) && (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#9CA3AF", fontSize: 13 }}>
              No readings recorded yet.
            </div>
          )}

          {historyData && historyData.data.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {historyData.data.map((r, i) => (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderTop: i === 0 ? "none" : "1px solid #F5F5F7",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: r.triggeredWorkOrder ? "#EF4444" : "#22C55E",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ width: 90, fontSize: 13, fontWeight: 700, color: "#111827" }}>
                    {r.value} {meter.unit}
                  </div>
                  <div style={{ flex: 1, fontSize: 12, color: "#6B7280" }}>
                    {r.recordedByName}
                    {r.note ? ` — "${r.note}"` : ""}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#9CA3AF", flexShrink: 0 }}>{formatDateTime(r.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}