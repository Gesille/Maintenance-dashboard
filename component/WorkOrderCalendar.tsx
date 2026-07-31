"use client";

import { useMemo, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, X, Clock, CheckCircle2 } from "lucide-react";
import { WorkOrder, WOPriority } from "@/types/types";

// ─── Config ─────────────────────────────────────────────────────────────────

const START_HOUR = 6;
const END_HOUR = 20;
const ROW_HEIGHT = 44;
const DAY_COUNT = 7;

const PRIORITY_COLOR: Record<WOPriority, { bg: string; border: string; text: string }> = {
  high: { bg: "#FEF2F2", border: "#EF4444", text: "#991B1B" },
  medium: { bg: "#FFFBEB", border: "#F59E0B", text: "#92400E" },
  low: { bg: "#F0FDF4", border: "#22C55E", text: "#166534" },
};

const DONE_COLOR = { bg: "#F0FDF4", border: "#16A34A", text: "#166534" };

// ─── Date helpers ───────────────────────────────────────────────────────────

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatWeekRange(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth();
  const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString("en-US", {
    month: sameMonth ? undefined : "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startStr} – ${endStr}`;
}

function formatHour(h: number): string {
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12} ${period}`;
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// ─── Component ──────────────────────────────────────────────────────────────

interface WorkOrderCalendarProps {
  workOrders: WorkOrder[];
  selectedId: string | null;
  onSelect: (wo: WorkOrder) => void;
  onSchedule?: (id: string, isoDate: string) => void;
  lastRepairByAsset?: Record<string, string>;
}

type ScheduledWO = WorkOrder & {
  scheduleDateRaw?: string | null;
  signatureUrl?: string | null;
  checklistResult?: "pass" | "flag" | "fail" | null;
};

interface PendingSlot {
  date: Date;
}

interface SignaturePreview {
  url: string;
  title: string;
  x: number;
  y: number;
}

export function WorkOrderCalendar({
  workOrders,
  selectedId,
  onSelect,
  onSchedule,
  lastRepairByAsset = {},
}: WorkOrderCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [isOpen, setIsOpen] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<PendingSlot | null>(null);
  const [pickedWOId, setPickedWOId] = useState<string>("");
  const [signaturePreview, setSignaturePreview] = useState<SignaturePreview | null>(null);

  const days = useMemo(
    () => Array.from({ length: DAY_COUNT }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const weekEnd = days[DAY_COUNT - 1];

  const scheduled = (workOrders as ScheduledWO[]).filter((wo) => !!wo.scheduleDateRaw);
  const unscheduled = (workOrders as ScheduledWO[]).filter((wo) => !wo.scheduleDateRaw);

  const eventsByDay = useMemo(() => {
    const map = new Map<number, ScheduledWO[]>();
    days.forEach((_, i) => map.set(i, []));
    for (const wo of scheduled) {
      const date = new Date(wo.scheduleDateRaw as string);
      if (isNaN(date.getTime())) continue;
      const dayIndex = days.findIndex((d) => isSameDay(d, date));
      if (dayIndex === -1) continue;
      map.get(dayIndex)!.push(wo);
    }
    return map;
  }, [days, scheduled]);

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const today = new Date();

  const handleSelect = (wo: WorkOrder) => {
    onSelect(wo);
    setIsOpen(false);
  };

  const handleSlotClick = (e: React.MouseEvent<HTMLDivElement>, day: Date) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    let hourFloat = START_HOUR + offsetY / ROW_HEIGHT;
    hourFloat = Math.min(Math.max(hourFloat, START_HOUR), END_HOUR);
    hourFloat = Math.round(hourFloat * 2) / 2;

    const date = new Date(day);
    date.setHours(Math.floor(hourFloat), (hourFloat % 1) * 60, 0, 0);

    setPickedWOId(unscheduled[0]?.id ?? "");
    setPendingSlot({ date });
  };

  const confirmSchedule = () => {
    if (!pendingSlot || !pickedWOId || !onSchedule) return;
    onSchedule(pickedWOId, pendingSlot.date.toISOString());
    setPendingSlot(null);
    setPickedWOId("");
  };

  const pickedWO = unscheduled.find((wo) => wo.id === pickedWOId) ?? null;
  const lastRepairKey = pickedWO ? (pickedWO.assetCode || pickedWO.asset) : null;
  const lastRepairIso = lastRepairKey ? lastRepairByAsset[lastRepairKey] : null;

  return (
    <>
      {/* ── Trigger button ── */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setIsOpen(true)}
          title="Repair Schedule"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "1px solid #E0E7FF",
            background: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#C7D2FE";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(99,102,241,0.1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#E0E7FF";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 3px rgba(15,23,42,0.04)";
          }}
        >
          <CalendarClock size={17} color="#6366F1" strokeWidth={2} />
        </button>
        {unscheduled.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: -5,
              right: -5,
              minWidth: 15,
              height: 15,
              padding: "0 3px",
              borderRadius: 999,
              background: "#F59E0B",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #fff",
            }}
          >
            {unscheduled.length}
          </span>
        )}
      </div>

      {/* ── Calendar modal ── */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(1000px, 100%)",
              maxHeight: "85vh",
              background: "#FFFFFF",
              borderRadius: 16,
              boxShadow: "0 20px 60px rgba(15,23,42,0.35)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid #F1F5F9",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CalendarClock size={16} color="#fff" strokeWidth={2} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#1E1B4B", margin: 0, letterSpacing: "-0.01em" }}>
                    Repair Schedule
                  </p>
                  <p style={{ fontSize: 12, color: "#818CF8", margin: 0 }}>
                    {formatWeekRange(weekStart, weekEnd)} · click an empty slot to schedule · hover a completed job for signature
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {unscheduled.length > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#92400E",
                      background: "#FFFBEB",
                      border: "1px solid #FDE68A",
                      borderRadius: 999,
                      padding: "3px 9px",
                      marginRight: 6,
                    }}
                  >
                    {unscheduled.length} unscheduled
                  </span>
                )}
                <button onClick={() => setWeekStart((d) => addDays(d, -7))} aria-label="Previous week" style={navBtnStyle}>
                  <ChevronLeft size={15} color="#475569" strokeWidth={2} />
                </button>
                <button
                  onClick={() => setWeekStart(startOfWeek(new Date()))}
                  style={{ ...navBtnStyle, width: "auto", padding: "0 12px", fontSize: 12, fontWeight: 600 }}
                >
                  Today
                </button>
                <button onClick={() => setWeekStart((d) => addDays(d, 7))} aria-label="Next week" style={navBtnStyle}>
                  <ChevronRight size={15} color="#475569" strokeWidth={2} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close calendar"
                  style={{ ...navBtnStyle, marginLeft: 4, background: "#F8FAFC" }}
                >
                  <X size={15} color="#475569" strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Grid */}
            <div style={{ display: "flex", overflowY: "auto", flex: 1 }}>
              <div style={{ width: 52, flexShrink: 0, paddingTop: 28 }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    style={{
                      height: ROW_HEIGHT,
                      fontSize: 10,
                      color: "#94A3B8",
                      textAlign: "right",
                      paddingRight: 8,
                      transform: "translateY(-6px)",
                    }}
                  >
                    {formatHour(h)}
                  </div>
                ))}
              </div>

              <div style={{ flex: 1, display: "flex" }}>
                {days.map((day, i) => {
                  const isToday = isSameDay(day, today);
                  const events = eventsByDay.get(i) ?? [];

                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        borderLeft: "1px solid #F1F5F9",
                        position: "relative",
                        background: isToday ? "#FAFAFF" : "transparent",
                      }}
                    >
                      <div
                        style={{
                          height: 28,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "sticky",
                          top: 0,
                          background: isToday ? "#FAFAFF" : "#fff",
                          zIndex: 1,
                        }}
                      >
                        <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>
                          {day.toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: isToday ? 700 : 500,
                            color: isToday ? "#6366F1" : "#475569",
                          }}
                        >
                          {day.getDate()}
                        </span>
                      </div>

                      <div
                        style={{ position: "relative", height: hours.length * ROW_HEIGHT, cursor: onSchedule ? "pointer" : "default" }}
                        onClick={onSchedule ? (e) => handleSlotClick(e, day) : undefined}
                      >
                        {hours.map((h) => (
                          <div key={h} style={{ height: ROW_HEIGHT, borderTop: "1px solid #F8FAFC" }} />
                        ))}

                        {events.map((wo) => {
                          const date = new Date(wo.scheduleDateRaw as string);
                          const hourFloat = date.getHours() + date.getMinutes() / 60;
                          const clamped = Math.min(Math.max(hourFloat, START_HOUR), END_HOUR);
                          const top = (clamped - START_HOUR) * ROW_HEIGHT;
                          const isDone = wo.status === "done";
                          const colors = isDone ? DONE_COLOR : PRIORITY_COLOR[wo.priority];
                          const isSelected = wo.id === selectedId;
                          const timeLabel = date.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          });
                          const hasSignature = isDone && !!wo.signatureUrl;

                          return (
                            <button
                              key={wo.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(wo);
                              }}
                              onMouseEnter={(e) => {
                                if (!hasSignature) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                setSignaturePreview({
                                  url: wo.signatureUrl as string,
                                  title: wo.title,
                                  x: rect.right + 8,
                                  y: rect.top,
                                });
                              }}
                              onMouseLeave={() => setSignaturePreview(null)}
                              title={`${wo.title} — ${timeLabel}${isDone ? " · Completed" : ""}`}
                              style={{
                                position: "absolute",
                                top,
                                left: 3,
                                right: 3,
                                textAlign: "left",
                                background: colors.bg,
                                border: `1px solid ${isSelected ? "#6366F1" : colors.border}`,
                                borderLeft: `3px solid ${colors.border}`,
                                borderRadius: 6,
                                padding: "3px 6px",
                                cursor: "pointer",
                                boxShadow: isSelected ? "0 0 0 2px rgba(99,102,241,0.25)" : "none",
                                zIndex: isSelected ? 2 : 1,
                                opacity: isDone ? 0.85 : 1,
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                {isDone && <CheckCircle2 size={10} color={colors.border} strokeWidth={2.5} />}
                                <span style={{ fontSize: 9.5, fontWeight: 700, color: colors.text }}>{timeLabel}</span>
                              </div>
                              <div
                                style={{
                                  fontSize: 10.5,
                                  color: "#1E293B",
                                  fontWeight: 500,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {wo.asset}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Signature hover preview ── */}
      {signaturePreview && (
        <div
          style={{
            position: "fixed",
            top: signaturePreview.y,
            left: signaturePreview.x,
            zIndex: 1200,
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 12px 32px rgba(15,23,42,0.25)",
            border: "1px solid #E5E7EB",
            padding: 10,
            width: 200,
            pointerEvents: "none",
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, color: "#166534", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 4 }}>
            <CheckCircle2 size={11} /> Technician signature
          </p>
          <img
            src={signaturePreview.url}
            alt={`Signature for ${signaturePreview.title}`}
            style={{
              width: "100%",
              height: "auto",
              background: "#F8FAFC",
              border: "1px solid #F1F5F9",
              borderRadius: 6,
            }}
          />
        </div>
      )}

      {/* ── Schedule dialog (unchanged) ── */}
      {pendingSlot && (
        <div
          onClick={() => setPendingSlot(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(380px, 100%)",
              background: "#fff",
              borderRadius: 14,
              boxShadow: "0 20px 60px rgba(15,23,42,0.35)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={15} color="#6366F1" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1E1B4B" }}>Schedule repair</span>
              </div>
              <button onClick={() => setPendingSlot(null)} style={{ ...navBtnStyle, background: "#F8FAFC" }}>
                <X size={14} color="#475569" />
              </button>
            </div>

            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, color: "#94A3B8", margin: "0 0 4px", fontWeight: 600 }}>WHEN</p>
                <p style={{ fontSize: 13, color: "#1E293B", margin: 0, fontWeight: 600 }}>
                  {formatDateShort(pendingSlot.date)} ·{" "}
                  {pendingSlot.date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </p>
              </div>

              <div>
                <p style={{ fontSize: 11, color: "#94A3B8", margin: "0 0 4px", fontWeight: 600 }}>WORK ORDER</p>
                {unscheduled.length === 0 ? (
                  <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>
                    Nothing unscheduled — every open work order already has a date.
                  </p>
                ) : (
                  <select
                    value={pickedWOId}
                    onChange={(e) => setPickedWOId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1.5px solid #E0E7FF",
                      fontSize: 12,
                      color: "#0F172A",
                      outline: "none",
                    }}
                  >
                    {unscheduled.map((wo) => (
                      <option key={wo.id} value={wo.id}>
                        {wo.id} · {wo.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {pickedWO && (
                <div
                  style={{
                    background: "#F8FAFF",
                    border: "1px solid #EEF0FF",
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontSize: 11,
                    color: "#64748B",
                  }}
                >
                  <strong style={{ color: "#475569" }}>{pickedWO.asset}</strong>
                  <br />
                  Last repaired:{" "}
                  {lastRepairIso
                    ? new Date(lastRepairIso).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "No previous repairs on file"}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => setPendingSlot(null)}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    borderRadius: 9,
                    border: "1px solid #E5E7EB",
                    background: "#fff",
                    color: "#475569",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSchedule}
                  disabled={!pickedWOId}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    borderRadius: 9,
                    border: "none",
                    background: pickedWOId
                      ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
                      : "#CBD5E1",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: pickedWOId ? "pointer" : "not-allowed",
                  }}
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: "1px solid #E5E7EB",
  background: "#fff",
  color: "#475569",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};