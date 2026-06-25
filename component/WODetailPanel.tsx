"use client";

import { useState } from "react";
import {
  MessageSquare,
  Edit3,
  MoreHorizontal,
  Share2,
  Calendar,
  ChevronRight,
  Send,
  Loader,
  Clock,
  MapPin,
  Wrench,
  Tag,
} from "lucide-react";
import {
  PRIORITY_CONFIG,
  CATEGORY_COLORS,
  STATUS_CONFIG,
  AVATAR_COLORS,
} from "@/types/tokens";
import { WorkOrder, WOStatus } from "@/types/types";
import {
  useGetMaintenanceMessagesQuery,
  usePostMaintenanceCommentMutation,
} from "@/redux/Maintenance/Maintenanceapi";

interface WODetailProps {
  wo: WorkOrder;
  onStatusChange: (id: string, status: WOStatus) => void;
  onChecklistToggle: (id: string, index: number) => void;
  updatingId: string | null;
}

const STATUS_ORDER: WOStatus[] = ["open", "in_progress", "on_hold", "done"];

// Gradient per status for hero header accent
const STATUS_GRADIENT: Record<WOStatus, string> = {
  open:        "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 60%, #FAF5FF 100%)",
  in_progress: "linear-gradient(135deg, #EFF6FF 0%, #EDE9FE 60%, #F0FDF4 100%)",
  on_hold:     "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 60%, #FFF7ED 100%)",
  done:        "linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 60%, #F0FDFA 100%)",
};

const STATUS_ACCENT: Record<WOStatus, string> = {
  open:        "#6366F1",
  in_progress: "#3B82F6",
  on_hold:     "#F59E0B",
  done:        "#10B981",
};

export function WODetailPanel({
  wo,
  onStatusChange,
  onChecklistToggle,
  updatingId,
}: WODetailProps) {
  const [tab, setTab] = useState<"details" | "comments">("details");
  const [note, setNote] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const checkedCount = wo.checklist.filter((c) => c.done).length;
  const checklistPct =
    wo.checklist.length > 0
      ? Math.round((checkedCount / wo.checklist.length) * 100)
      : 0;

  const priority = PRIORITY_CONFIG[wo.priority];
  const category = CATEGORY_COLORS[wo.category] ?? CATEGORY_COLORS["General"];
  const isUpdating = updatingId === wo.id;
  const accentColor = STATUS_ACCENT[wo.status];

  const { data: messages = [], isLoading: msgLoading } =
    useGetMaintenanceMessagesQuery(wo.numericId, { skip: !wo.numericId });
  const [postComment, { isLoading: posting }] =
    usePostMaintenanceCommentMutation();

  const handleSendComment = async () => {
    if (!commentBody.trim()) return;
    try {
      await postComment({
        id: wo.numericId,
        body: commentBody.trim(),
        authorName: "Manager",
        isInternal,
      }).unwrap();
      setCommentBody("");
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {/* ── Hero Header ── */}
      <div
        style={{
          background: STATUS_GRADIENT[wo.status],
          borderBottom: `2px solid ${accentColor}22`,
          padding: "24px 32px 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative background circle */}
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: `${accentColor}0D`,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -30,
            right: 80,
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: `${accentColor}08`,
            pointerEvents: "none",
          }}
        />

        {/* Breadcrumb */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>
            Work Orders
          </span>
          <ChevronRight size={12} color="#CBD5E1" />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              background: category.bg,
              color: category.text,
              padding: "2px 9px",
              borderRadius: 99,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            {wo.categoryLabel}
          </span>
          <span
            style={{
              fontSize: 10,
              color: "#A5B4FC",
              fontFamily: "monospace",
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            {wo.id}
          </span>
        </div>

        {/* Title row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 20,
            marginBottom: 14,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#0F172A",
                margin: "0 0 8px",
                letterSpacing: "-0.03em",
                lineHeight: 1.25,
              }}
            >
              {wo.title}
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 12,
                color: "#64748B",
                flexWrap: "wrap",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Calendar size={12} color="#A5B4FC" />
                Created {wo.createDate}
              </span>
              {wo.maintenanceTeam !== "—" && (
                <>
                  <span style={{ color: "#E2E8F0" }}>·</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <i
                      className="ti ti-users"
                      style={{ fontSize: 12, color: "#A5B4FC" }}
                      aria-hidden="true"
                    />
                    {wo.maintenanceTeam}
                  </span>
                </>
              )}
              {wo.isRecurring && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    background: "#F0FDF4",
                    color: "#15803D",
                    border: "1px solid #BBF7D0",
                    padding: "2px 8px",
                    borderRadius: 99,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <i
                    className="ti ti-refresh"
                    style={{ fontSize: 10 }}
                    aria-hidden="true"
                  />
                  Recurring
                </span>
              )}
              {wo.overdue && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: "#FEF2F2",
                    color: "#DC2626",
                    border: "1px solid #FECACA",
                    padding: "2px 9px",
                    borderRadius: 99,
                  }}
                >
                  ⚡ Overdue
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <ActionBtn
              icon={<MessageSquare size={13} />}
              label={`Comments${messages.length ? ` (${messages.length})` : ""}`}
              onClick={() => setTab("comments")}
              active={tab === "comments"}
              accentColor={accentColor}
            />
            <ActionBtn icon={<Edit3 size={13} />} label="Edit" accentColor={accentColor} />
            <ActionBtn icon={<MoreHorizontal size={14} />} accentColor={accentColor} />
            
          </div>
        </div>

        {/* ── Status stepper ── */}
        <div
          style={{
            display: "flex",
            gap: 4,
            paddingBottom: 16,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {STATUS_ORDER.map((s, idx) => {
            const cfg = STATUS_CONFIG[s];
            const isActive = wo.status === s;
            const isPast =
              STATUS_ORDER.indexOf(wo.status) > STATUS_ORDER.indexOf(s);

            return (
              <button
                key={s}
                onClick={() => !isUpdating && onStatusChange(wo.id, s)}
                disabled={isUpdating}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 16px",
                  borderRadius: 99,
                  border: `2px solid ${isActive ? accentColor : isPast ? "#E2E8F0" : "#E8EAFF"}`,
                  background: isActive
                    ? `${accentColor}12`
                    : isPast
                    ? "#F8FAFC"
                    : "transparent",
                  color: isActive ? accentColor : isPast ? "#94A3B8" : "#CBD5E1",
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  cursor: isUpdating ? "not-allowed" : "pointer",
                  opacity: isUpdating && !isActive ? 0.5 : 1,
                  transition: "all 0.15s ease",
                  letterSpacing: "-0.01em",
                  position: "relative",
                }}
              >
                {isUpdating && isActive ? (
                  <Loader
                    size={10}
                    style={{ animation: "spin 0.7s linear infinite" }}
                  />
                ) : isPast ? (
                  <i
                    className="ti ti-check"
                    style={{ fontSize: 11, color: "#94A3B8" }}
                    aria-hidden="true"
                  />
                ) : (
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: isActive ? accentColor : "#E2E8F0",
                      display: "inline-block",
                      flexShrink: 0,
                      ...(isActive
                        ? {
                            boxShadow: `0 0 0 3px ${accentColor}25`,
                            animation: "statusPulse 2.5s ease-in-out infinite",
                          }
                        : {}),
                    }}
                  />
                )}
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Tab switcher — inside hero */}
        <div
          style={{
            display: "flex",
            borderBottom: "none",
            marginBottom: -1,
          }}
        >
          {(["details", "comments"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "10px 18px",
                fontSize: 12,
                fontWeight: tab === t ? 700 : 500,
                color: tab === t ? accentColor : "#94A3B8",
                background: "none",
                border: "none",
                borderBottom: `2.5px solid ${tab === t ? accentColor : "transparent"}`,
                cursor: "pointer",
                marginBottom: -2,
                textTransform: "capitalize",
                letterSpacing: "-0.01em",
                transition: "all 0.15s",
              }}
            >
              {t === "comments" && messages.length > 0
                ? `Comments (${messages.length})`
                : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Hairline separator */}
      <div style={{ height: 1, background: "#E8EAFF" }} />

      {/* ── Body ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 32px",
          background: "#FAFBFF",
        }}
      >
        {tab === "details" && (
          <>
            {/* 4-col KPI cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 10,
                marginBottom: 28,
              }}
            >
              <KpiCard
                icon={<Calendar size={15} color={accentColor} />}
                label="Due date"
                value={wo.dueDate}
                accent={accentColor}
              />
              <KpiCard
                icon={
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      background: priority.bg,
                      color: priority.text,
                      padding: "1px 8px",
                      borderRadius: 99,
                    }}
                  >
                    {priority.label}
                  </span>
                }
                label="Priority"
                value={null}
                accent={accentColor}
              />
              <KpiCard
                icon={<Clock size={15} color={accentColor} />}
                label="Duration"
                value={`${wo.duration}h`}
                accent={accentColor}
              />
              <KpiCard
                icon={<i className="ti ti-calendar-event" style={{ fontSize: 15, color: accentColor }} aria-hidden="true" />}
                label="Ends"
                value={wo.scheduleEnd}
                accent={accentColor}
              />
            </div>

            {/* Equipment */}
            <SectionLabel label="Equipment" />
            <div
              style={{
                background: "#fff",
                border: "1px solid #E8EAFF",
                borderRadius: 14,
                overflow: "hidden",
                marginBottom: 24,
                boxShadow: "0 1px 4px rgba(99,102,241,0.06)",
              }}
            >
              <EquipRow icon={<Wrench size={13} color="#A5B4FC" />} label="Asset" value={wo.asset} />
              <EquipRow icon={<MapPin size={13} color="#A5B4FC" />} label="Location" value={wo.location} divider />
              <EquipRow icon={<Tag size={13} color="#A5B4FC" />} label="Category" value={wo.categoryLabel} divider />
              {wo.maintenanceType !== "—" && (
                <EquipRow
                  icon={<i className="ti ti-settings" style={{ fontSize: 13, color: "#A5B4FC" }} aria-hidden="true" />}
                  label="Type"
                  value={wo.maintenanceType}
                  divider
                />
              )}
              {wo.assetCode && (
                <EquipRow
                  icon={<i className="ti ti-barcode" style={{ fontSize: 13, color: "#A5B4FC" }} aria-hidden="true" />}
                  label="Asset code"
                  value={wo.assetCode}
                  divider
                />
              )}
              {wo.model && (
                <EquipRow
                  icon={<i className="ti ti-versions" style={{ fontSize: 13, color: "#A5B4FC" }} aria-hidden="true" />}
                  label="Model"
                  value={wo.model}
                  divider
                />
              )}
              {wo.serialNo && (
                <EquipRow
                  icon={<i className="ti ti-hash" style={{ fontSize: 13, color: "#A5B4FC" }} aria-hidden="true" />}
                  label="Serial no."
                  value={wo.serialNo}
                  divider
                />
              )}
            </div>

            {/* Assignees */}
            <SectionLabel label="Assigned technicians" />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 24,
              }}
            >
              {wo.assignees.length === 0 ? (
                <span
                  style={{
                    fontSize: 13,
                    color: "#94A3B8",
                    fontStyle: "italic",
                  }}
                >
                  No assignees
                </span>
              ) : (
                wo.assignees.map((a, i) => {
                  const av = AVATAR_COLORS[a.color];
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "#fff",
                        border: "1px solid #E8EAFF",
                        borderRadius: 99,
                        padding: "5px 12px 5px 6px",
                        boxShadow: "0 1px 3px rgba(99,102,241,0.06)",
                        transition: "all 0.15s",
                      }}
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          background: av?.bg ?? "#E0E7FF",
                          color: av?.text ?? "#3730A3",
                          fontSize: 9,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: `0 0 0 2px #fff, 0 0 0 3px ${av?.bg ?? "#E0E7FF"}`,
                        }}
                      >
                        {a.initials}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#334155",
                          fontWeight: 600,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {a.name}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Description */}
            <SectionLabel label="Description" />
            <div
              style={{
                background: "#fff",
                border: "1px solid #E8EAFF",
                borderRadius: 14,
                padding: "16px 20px",
                marginBottom: 24,
                boxShadow: "0 1px 4px rgba(99,102,241,0.05)",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: "#475569",
                  lineHeight: 1.8,
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}
              >
                {wo.description}
              </p>
            </div>

            {/* Checklist */}
            {wo.checklist.length > 0 && (
              <>
                <SectionLabel
                  label={`Checklist — ${checkedCount} of ${wo.checklist.length} done`}
                />
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #E8EAFF",
                    borderRadius: 14,
                    padding: "16px 20px",
                    marginBottom: 24,
                    boxShadow: "0 1px 4px rgba(99,102,241,0.05)",
                  }}
                >
                  {/* Progress bar */}
                  <div
                    style={{
                      height: 6,
                      borderRadius: 99,
                      background: "#E8EAFF",
                      marginBottom: 16,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${checklistPct}%`,
                        height: "100%",
                        borderRadius: 99,
                        background:
                          checklistPct === 100
                            ? "linear-gradient(90deg, #10B981, #34D399)"
                            : `linear-gradient(90deg, ${accentColor}, #8B5CF6)`,
                        transition: "width 0.4s ease",
                        boxShadow:
                          checklistPct > 0
                            ? `0 2px 8px ${accentColor}40`
                            : "none",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {wo.checklist.map((item, i) => (
                      <label
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          fontSize: 13,
                          color: item.done ? "#94A3B8" : "#334155",
                          cursor: "pointer",
                          textDecoration: item.done ? "line-through" : "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => onChecklistToggle(wo.id, i)}
                          style={{
                            width: 16,
                            height: 16,
                            accentColor: accentColor,
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Internal notes */}
            <SectionLabel label="Internal notes" />
            <div
              style={{
                background: "#fff",
                border: "1px solid #E8EAFF",
                borderRadius: 14,
                padding: "14px 16px",
                boxShadow: "0 1px 4px rgba(99,102,241,0.05)",
              }}
            >
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note visible only to your team…"
                rows={3}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  fontSize: 13,
                  resize: "vertical",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1.5px solid #E8EAFF",
                  background: "#FAFBFF",
                  color: "#334155",
                  outline: "none",
                  fontFamily: "inherit",
                  lineHeight: 1.6,
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = accentColor)}
                onBlur={(e) => (e.target.style.borderColor = "#E8EAFF")}
              />
              {note.trim() && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 8,
                  }}
                >
                  <button
                    style={{
                      padding: "7px 16px",
                      background: accentColor,
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: `0 3px 10px ${accentColor}40`,
                    }}
                  >
                    Save note
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {tab === "comments" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {msgLoading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 0",
                  color: "#94A3B8",
                  fontSize: 13,
                }}
              >
                <Loader
                  size={20}
                  color="#A5B4FC"
                  style={{
                    animation: "spin 0.7s linear infinite",
                    display: "block",
                    margin: "0 auto 8px",
                  }}
                />
                Loading messages…
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "56px 0" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "#EEF2FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <i
                    className="ti ti-message-circle"
                    style={{ fontSize: 24, color: "#A5B4FC" }}
                    aria-hidden="true"
                  />
                </div>
                <p style={{ fontSize: 13, color: "#94A3B8", margin: 0, fontWeight: 500 }}>
                  No comments yet
                </p>
                <p style={{ fontSize: 12, color: "#CBD5E1", margin: "4px 0 0" }}>
                  Be the first to add one
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    padding: "16px 0",
                    borderBottom: "1px solid #F0F4FF",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        background: msg.isInternal
                          ? "linear-gradient(135deg, #FEF3C7, #FDE68A)"
                          : "linear-gradient(135deg, #EDE9FE, #DDD6FE)",
                        color: msg.isInternal ? "#92400E" : "#5B21B6",
                        fontSize: 10,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: msg.isInternal
                          ? "0 2px 6px rgba(245,158,11,0.25)"
                          : "0 2px 6px rgba(139,92,246,0.2)",
                      }}
                    >
                      {(msg.author?.name ?? "?")
                        .split(" ")
                        .map((w: string) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#1E293B",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {msg.author?.name ?? "Unknown"}
                    </span>
                    {msg.isInternal && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          background: "#FEF3C7",
                          color: "#92400E",
                          border: "1px solid #FDE68A",
                          padding: "1px 7px",
                          borderRadius: 99,
                        }}
                      >
                        Internal
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 11,
                        color: "#94A3B8",
                        marginLeft: "auto",
                      }}
                    >
                      {new Date(msg.date).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#475569",
                      lineHeight: 1.7,
                      margin: 0,
                      paddingLeft: 38,
                    }}
                    dangerouslySetInnerHTML={{ __html: msg.body }}
                  />
                </div>
              ))
            )}

            {/* Comment composer */}
            <div
              style={{
                marginTop: 24,
                paddingTop: 20,
                borderTop: "1px solid #E8EAFF",
              }}
            >
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Write a comment…"
                rows={3}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  fontSize: 13,
                  resize: "none",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1.5px solid #E8EAFF",
                  background: "#fff",
                  color: "#334155",
                  outline: "none",
                  fontFamily: "inherit",
                  lineHeight: 1.6,
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  boxShadow: "0 1px 4px rgba(99,102,241,0.05)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = accentColor;
                  e.target.style.boxShadow = `0 0 0 3px ${accentColor}18`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#E8EAFF";
                  e.target.style.boxShadow = "0 1px 4px rgba(99,102,241,0.05)";
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 10,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 12,
                    color: "#64748B",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    style={{ accentColor }}
                  />
                  Internal note
                </label>
                <button
                  onClick={handleSendComment}
                  disabled={posting || !commentBody.trim()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "8px 16px",
                    background:
                      posting || !commentBody.trim() ? "#E8EAFF" : accentColor,
                    color: posting || !commentBody.trim() ? "#A5B4FC" : "#fff",
                    border: "none",
                    borderRadius: 9,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor:
                      posting || !commentBody.trim() ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                    boxShadow:
                      !posting && commentBody.trim()
                        ? `0 3px 10px ${accentColor}40`
                        : "none",
                  }}
                >
                  {posting ? (
                    <Loader
                      size={12}
                      style={{ animation: "spin 0.7s linear infinite" }}
                    />
                  ) : (
                    <Send size={12} />
                  )}
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes statusPulse {
          0%, 100% { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
          50% { box-shadow: 0 0 0 5px transparent; opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "#A5B4FC",
        margin: "0 0 10px",
      }}
    >
      {label}
    </p>
  );
}

function KpiCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E8EAFF",
        borderRadius: 14,
        padding: "14px 16px",
        boxShadow: "0 1px 4px rgba(99,102,241,0.06)",
        borderTop: `3px solid ${accent}25`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 10,
          color: "#94A3B8",
          marginBottom: 10,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          fontWeight: 700,
        }}
      >
        {icon} {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", letterSpacing: "-0.01em" }}>
        {value ?? <span style={{ color: "#CBD5E1" }}>—</span>}
      </div>
    </div>
  );
}

function EquipRow({
  icon,
  label,
  value,
  divider = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "11px 18px",
        borderTop: divider ? "1px solid #F0F4FF" : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: 140,
          flexShrink: 0,
        }}
      >
        {icon}
        <span
          style={{
            fontSize: 11,
            color: "#94A3B8",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: 13,
          color: "#1E293B",
          fontWeight: 500,
          letterSpacing: "-0.01em",
        }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  active,
  accentColor,
}: {
  icon: React.ReactNode;
  label?: string;
  onClick?: () => void;
  active?: boolean;
  accentColor?: string;
}) {
  const accent = accentColor ?? "#6366F1";
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: label ? 6 : 0,
        padding: label ? "7px 13px" : "7px 9px",
        fontSize: 12,
        fontWeight: 500,
        color: active ? accent : "#64748B",
        background: active ? `${accent}10` : "#fff",
        border: `1.5px solid ${active ? `${accent}40` : "#E8EAFF"}`,
        borderRadius: 9,
        cursor: "pointer",
        transition: "all 0.15s",
        letterSpacing: "-0.01em",
      }}
    >
      {icon}
      {label}
    </button>
  );
}