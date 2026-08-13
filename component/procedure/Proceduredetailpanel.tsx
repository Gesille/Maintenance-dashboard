"use client";

import { CSSProperties, useMemo, useState } from "react";
import { Procedure, ProcedureField, UpdateProcedureInput } from "@/redux/procedure/Procedureapi";
import { BRAND_GRADIENT, BRAND_SOFT_BG, BRAND_SOFT_BORDER, BRAND_TEXT, fieldTypeMeta, STATUS_STYLES, timeAgo } from "@/types/Procedureui";


interface Props {
  procedure: Procedure;
  onSaveDetails: (input: Omit<UpdateProcedureInput, "id">) => Promise<void>;
  isSavingDetails: boolean;
  onPublish: () => Promise<void>;
  isPublishing: boolean;
  onDuplicate: () => Promise<void>;
  isDuplicating: boolean;
  onDelete: () => Promise<void>;
  isDeleting: boolean;
  onAttach: () => void;
  onAddField: () => void;
  onEditField: (field: ProcedureField) => void;
  onRemoveField: (fieldId: string) => Promise<void>;
  removingFieldId: string | null;
  onMoveField: (fieldId: string, direction: "up" | "down") => Promise<void>;
  reorderingFieldId: string | null;
}

export function ProcedureDetailPanel({
  procedure,
  onSaveDetails,
  isSavingDetails,
  onPublish,
  isPublishing,
  onDuplicate,
  isDuplicating,
  onDelete,
  isDeleting,
  onAttach,
  onAddField,
  onEditField,
  onRemoveField,
  removingFieldId,
  onMoveField,
  reorderingFieldId,
}: Props) {
  const statusStyle = STATUS_STYLES[procedure.status];
  const sortedFields = useMemo(() => [...procedure.fields].sort((a, b) => a.order - b.order), [procedure.fields]);
  const answerableCount = sortedFields.filter((f) => f.type !== "section_header").length;
  const scorableCount = sortedFields.filter((f) => f.scoringEnabled).length;
  const maxPossibleScore = sortedFields.reduce((sum, f) => sum + (f.scoringEnabled ? f.maxScore : 0), 0);

  const [editing, setEditing] = useState(false);

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#F8FAFF" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "28px 32px 60px" }}>
        {/* Header */}
        <div
  style={{
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 32,
    marginBottom: 24,
  }}
>
  {/* LEFT */}
  <div style={{ minWidth: 0, flex: 1 }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 999,
          fontSize: 11.5,
          fontWeight: 700,
          background: statusStyle.bg,
          color: statusStyle.fg,
          border: `1px solid ${statusStyle.border}`,
          lineHeight: 1.2,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: statusStyle.dot,
          }}
        />
        {statusStyle.label}
      </span>

      <span
        style={{
          fontSize: 12,
          color: "#9CA3AF",
        }}
      >
        Updated {timeAgo(procedure.updatedAt)} · by{" "}
        {procedure.createdByName}
      </span>
    </div>

    <h1
      style={{
        fontSize: 25,
        fontWeight: 800,
        color: "#111827",
        margin: 0,
        letterSpacing: "-0.025em",
        lineHeight: 1.25,
      }}
    >
      {procedure.title}
    </h1>

    {procedure.description && (
      <p
        style={{
          fontSize: 13.5,
          color: "#6B7280",
          lineHeight: 1.6,
          margin: "7px 0 0",
          maxWidth: 650,
        }}
      >
        {procedure.description}
      </p>
    )}
  </div>

  {/* ACTIONS */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexShrink: 0,
      paddingTop: 0,
    }}
  >
    {/* Attach */}
    <button
      onClick={onAttach}
      style={{
        height: 42,
        padding: "0 15px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: 11,
        border: "1px solid #E5E7EB",
        background: "#FFFFFF",
        color: "#374151",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#F9FAFB";
        e.currentTarget.style.borderColor = "#D1D5DB";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#FFFFFF";
        e.currentTarget.style.borderColor = "#E5E7EB";
      }}
    >
      <i
        className="ti ti-link"
        style={{
          fontSize: 16,
          color: "#6B7280",
        }}
        aria-hidden="true"
      />
      Attach
    </button>

    {/* Publish */}
    <button
      onClick={onPublish}
      disabled={isPublishing || procedure.fields.length === 0}
      style={{
        height: 42,
        padding: "0 18px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        border: "none",
        borderRadius: 11,
        background:
          isPublishing || procedure.fields.length === 0
            ? "#D1D5DB"
            : "#8B5CF6",
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: 700,
        cursor:
          isPublishing || procedure.fields.length === 0
            ? "not-allowed"
            : "pointer",
        boxShadow:
          isPublishing || procedure.fields.length === 0
            ? "none"
            : "0 4px 12px rgba(139, 92, 246, 0.22)",
        transition: "all 0.15s ease",
      }}
    >
      <i
        className={
          isPublishing
            ? "ti ti-loader-2"
            : "ti ti-rocket"
        }
        style={{
          fontSize: 15,
          ...(isPublishing
            ? { animation: "spin 1s linear infinite" }
            : {}),
        }}
        aria-hidden="true"
      />

      {isPublishing ? "Publishing..." : "Publish"}
    </button>

    {/* More */}
    <HeaderMenu
      status={procedure.status}
      onEdit={() => setEditing((v) => !v)}
      onPublish={onPublish}
      isPublishing={isPublishing}
      onDuplicate={onDuplicate}
      isDuplicating={isDuplicating}
      onDelete={onDelete}
      isDeleting={isDeleting}
      canPublish={procedure.fields.length > 0}
    />
  </div>
</div>

        {/* Tags / teams */}
        {(procedure.tags.length > 0 || procedure.teams.length > 0) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
            {procedure.teams.map((team) => (
              <span key={team} style={pillStyle("#EEF2FF", "#4338CA")}>
                <i className="ti ti-users" style={{ fontSize: 11 }} aria-hidden="true" />
                {team}
              </span>
            ))}
            {procedure.tags.map((tag) => (
              <span key={tag} style={pillStyle("#F3F4F6", "#4B5563")}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          <StatCard icon="ti-list-details" label="Fields" value={`${answerableCount}`} />
          <StatCard
            icon="ti-target-arrow"
            label="Scoring"
            value={procedure.scoringEnabled ? `Goal ${procedure.goalScore}` : "Off"}
          />
          <StatCard
            icon="ti-star"
            label="Max score"
            value={procedure.scoringEnabled ? `${maxPossibleScore} pts (${scorableCount} fields)` : "—"}
          />
          <StatCard icon="ti-calendar-plus" label="Created" value={timeAgo(procedure.createdAt)} />
        </div>

        {editing && (
          <EditDetailsForm
            procedure={procedure}
            onCancel={() => setEditing(false)}
            onSave={async (input) => {
              await onSaveDetails(input);
              setEditing(false);
            }}
            isSaving={isSavingDetails}
          />
        )}

        {/* Fields */}
        <div style={{ background: "#fff", border: "1px solid #EEF0F4", borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>Fields</h2>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: "3px 0 0" }}>
                What a technician sees and fills out when this procedure is attached to a work order.
              </p>
            </div>
            <button onClick={onAddField} style={addFieldButtonStyle}>
              <i className="ti ti-plus" style={{ fontSize: 13 }} aria-hidden="true" />
              Add field
            </button>
          </div>

          {sortedFields.length === 0 ? (
            <FieldsEmptyState onAddField={onAddField} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sortedFields.map((field, i) => (
                <FieldRow
                  key={field.id}
                  field={field}
                  index={i}
                  isFirst={i === 0}
                  isLast={i === sortedFields.length - 1}
                  onEdit={() => onEditField(field)}
                  onRemove={() => onRemoveField(field.id)}
                  isRemoving={removingFieldId === field.id}
                  onMoveUp={() => onMoveField(field.id, "up")}
                  onMoveDown={() => onMoveField(field.id, "down")}
                  isReordering={reorderingFieldId === field.id}
                  conditionLabel={
                    field.condition
                      ? sortedFields.find((f) => f.id === field.condition!.fieldId)?.label ?? null
                      : null
                  }
                />
              ))}
            </div>
          )}

          {procedure.status === "draft" && procedure.fields.length === 0 && (
            <p style={{ fontSize: 12, color: "#9CA3AF", margin: "12px 0 0", textAlign: "center" }}>
              Add at least one field before publishing this procedure.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Header menu (publish / duplicate / delete) ────────────────────────────

function HeaderMenu({
  status,
  onEdit,
  onPublish,
  isPublishing,
  onDuplicate,
  isDuplicating,
  onDelete,
  isDeleting,
  canPublish,
}: {
  status: Procedure["status"];
  onEdit: () => void;
  onPublish: () => Promise<void>;
  isPublishing: boolean;
  onDuplicate: () => Promise<void>;
  isDuplicating: boolean;
  onDelete: () => Promise<void>;
  isDeleting: boolean;
  canPublish: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      {status === "draft" && (
        <button
          onClick={onPublish}
          disabled={isPublishing || !canPublish}
          title={!canPublish ? "Add at least one field first" : undefined}
          style={{
            ...primaryActionStyle,
            background: BRAND_GRADIENT,
            color: "#fff",
            border: "none",
            boxShadow: "0 6px 16px rgba(99,102,241,0.3)",
            opacity: isPublishing || !canPublish ? 0.6 : 1,
            cursor: isPublishing || !canPublish ? "default" : "pointer",
            marginRight: 8,
          }}
        >
          <i className="ti ti-rocket" style={{ fontSize: 14 }} aria-hidden="true" />
          {isPublishing ? "Publishing…" : "Publish"}
        </button>
      )}

      <button onClick={() => setOpen((v) => !v)} style={iconButtonStyle} aria-label="More actions">
        <i className="ti ti-dots" style={{ fontSize: 16 }} aria-hidden="true" />
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 38,
              width: 190,
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #EEF0F4",
              boxShadow: "0 12px 32px rgba(17,24,39,0.14)",
              padding: 6,
              zIndex: 20,
            }}
          >
            <MenuItem
              icon="ti-pencil"
              label="Edit details"
              onClick={() => {
                onEdit();
                setOpen(false);
              }}
            />
            <MenuItem
              icon="ti-copy"
              label={isDuplicating ? "Duplicating…" : "Duplicate"}
              onClick={() => {
                setOpen(false);
                onDuplicate();
              }}
              disabled={isDuplicating}
            />
            <div style={{ height: 1, background: "#F3F4F6", margin: "5px 4px" }} />
            <MenuItem
              icon="ti-trash"
              label={isDeleting ? "Deleting…" : "Delete"}
              danger
              disabled={isDeleting}
              onClick={() => {
                setOpen(false);
                if (window.confirm("Delete this procedure? Work orders it's already attached to keep their copy.")) {
                  onDelete();
                }
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
  disabled,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        borderRadius: 8,
        border: "none",
        background: "transparent",
        fontSize: 12.5,
        fontWeight: 600,
        color: danger ? "#DC2626" : "#374151",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
        textAlign: "left",
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = danger ? "#FEF2F2" : "#F9FAFB")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <i className={`ti ${icon}`} style={{ fontSize: 14 }} aria-hidden="true" />
      {label}
    </button>
  );
}

// ── Edit details (inline form) ─────────────────────────────────────────────

function EditDetailsForm({
  procedure,
  onCancel,
  onSave,
  isSaving,
}: {
  procedure: Procedure;
  onCancel: () => void;
  onSave: (input: Omit<UpdateProcedureInput, "id">) => Promise<void>;
  isSaving: boolean;
}) {
  const [title, setTitle] = useState(procedure.title);
  const [description, setDescription] = useState(procedure.description ?? "");
  const [tags, setTags] = useState(procedure.tags.join(", "));
  const [teams, setTeams] = useState(procedure.teams.join(", "));
  const [scoringEnabled, setScoringEnabled] = useState(procedure.scoringEnabled);
  const [goalScore, setGoalScore] = useState(procedure.goalScore);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) return setError("Give the procedure a title.");
    setError(null);
    await onSave({
      title: title.trim(),
      description: description.trim() || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      teams: teams.split(",").map((t) => t.trim()).filter(Boolean),
      scoringEnabled,
      goalScore: scoringEnabled ? goalScore : 0,
    });
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #EEF0F4", borderRadius: 16, padding: 20, marginBottom: 24 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 14px" }}>Edit details</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} autoFocus />
        </div>

        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Tags</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="safety, hvac" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Teams in charge</label>
            <input value={teams} onChange={(e) => setTeams(e.target.value)} placeholder="Facilities" style={inputStyle} />
          </div>
        </div>

        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#92400E", cursor: "pointer" }}>
            <input type="checkbox" checked={scoringEnabled} onChange={(e) => setScoringEnabled(e.target.checked)} />
            Score this procedure
          </label>
          {scoringEnabled && (
            <div style={{ marginTop: 10 }}>
              <label style={{ ...labelStyle, color: "#92400E" }}>Goal score</label>
              <input
                type="number"
                value={goalScore}
                onChange={(e) => setGoalScore(Number(e.target.value))}
                style={{ ...inputStyle, width: 110 }}
                min={0}
              />
            </div>
          )}
        </div>

        {error && (
          <div style={{ fontSize: 12.5, color: "#B91C1C", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 10px" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ ...secondaryButtonStyle, flex: 1, justifyContent: "center" }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: "none",
              background: BRAND_GRADIENT,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: isSaving ? "default" : "pointer",
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Field row ────────────────────────────────────────────────────────────

function FieldRow({
  field,
  index,
  isFirst,
  isLast,
  onEdit,
  onRemove,
  isRemoving,
  onMoveUp,
  onMoveDown,
  isReordering,
  conditionLabel,
}: {
  field: ProcedureField;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onRemove: () => void;
  isRemoving: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isReordering: boolean;
  conditionLabel: string | null;
}) {
  const meta = fieldTypeMeta(field.type);
  const isSection = field.type === "section_header";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "12px 12px",
        borderRadius: 12,
        border: "1px solid #F0F0F2",
        background: isSection ? "#FAFAFC" : "#fff",
        opacity: isRemoving ? 0.5 : 1,
      }}
    >
      {/* Reorder controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0, paddingTop: 2 }}>
        <button
          onClick={onMoveUp}
          disabled={isFirst || isReordering}
          aria-label="Move field up"
          style={reorderButtonStyle(isFirst || isReordering)}
        >
          <i className="ti ti-chevron-up" style={{ fontSize: 12 }} aria-hidden="true" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast || isReordering}
          aria-label="Move field down"
          style={reorderButtonStyle(isLast || isReordering)}
        >
          <i className="ti ti-chevron-down" style={{ fontSize: 12 }} aria-hidden="true" />
        </button>
      </div>

      {/* Type icon */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: BRAND_SOFT_BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <i className={`ti ${meta.icon}`} style={{ fontSize: 15, color: BRAND_TEXT }} aria-hidden="true" />
      </div>

      {/* Content */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: isSection ? 13.5 : 13,
              fontWeight: isSection ? 800 : 600,
              color: "#111827",
              textTransform: isSection ? "uppercase" : "none",
              letterSpacing: isSection ? "0.03em" : "normal",
            }}
          >
            {field.label}
          </span>
          {field.required && !isSection && <Badge text="Required" bg="#FEF2F2" fg="#B91C1C" />}
          {field.scoringEnabled && <Badge text={`${field.maxScore || "—"} pts`} bg="#FFFBEB" fg="#B45309" />}
          {conditionLabel && <Badge text={`If ${conditionLabel}`} bg="#F3F4F6" fg="#4B5563" />}
        </div>
        <p style={{ fontSize: 11.5, color: "#9CA3AF", margin: "3px 0 0" }}>
          {meta.label}
          {field.type === "multiple_choice" && field.options.length > 0 && ` · ${field.options.length} options`}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button onClick={onEdit} aria-label={`Edit ${field.label}`} style={iconButtonStyleSm}>
          <i className="ti ti-pencil" style={{ fontSize: 13 }} aria-hidden="true" />
        </button>
        <button
          onClick={onRemove}
          disabled={isRemoving}
          aria-label={`Remove ${field.label}`}
          style={{ ...iconButtonStyleSm, borderColor: "#FECACA", color: "#DC2626", cursor: isRemoving ? "wait" : "pointer" }}
        >
          <i className="ti ti-trash" style={{ fontSize: 13 }} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function Badge({ text, bg, fg }: { text: string; bg: string; fg: string }) {
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        color: fg,
        background: bg,
        borderRadius: 6,
        padding: "2px 7px",
      }}
    >
      {text}
    </span>
  );
}

function FieldsEmptyState({ onAddField }: { onAddField: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 12px" }}>
      <div
        style={{
          width: 40,
          height: 40,
          margin: "0 auto 10px",
          borderRadius: 11,
          background: BRAND_SOFT_BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <i className="ti ti-list-details" style={{ fontSize: 18, color: BRAND_TEXT }} aria-hidden="true" />
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>No fields yet</p>
      <p style={{ fontSize: 12, color: "#9CA3AF", margin: "0 0 14px" }}>
        Add text prompts, checkboxes, inspections, or photo requests.
      </p>
      <button onClick={onAddField} style={{ ...addFieldButtonStyle, margin: "0 auto" }}>
        <i className="ti ti-plus" style={{ fontSize: 13 }} aria-hidden="true" />
        Add your first field
      </button>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #EEF0F4", borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 13, color: "#8B5CF6" }} aria-hidden="true" />
        <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {value}
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

function pillStyle(bg: string, fg: string): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11.5,
    fontWeight: 700,
    color: fg,
    background: bg,
    borderRadius: 7,
    padding: "4px 10px",
  };
}

function reorderButtonStyle(disabled: boolean): CSSProperties {
  return {
    width: 20,
    height: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    background: "transparent",
    color: disabled ? "#E5E7EB" : "#9CA3AF",
    cursor: disabled ? "default" : "pointer",
  };
}

const primaryActionStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  padding: "9px 16px",
  borderRadius: 11,
  fontSize: 13,
  fontWeight: 700,
  border: `1px solid ${BRAND_SOFT_BORDER}`,
  background: BRAND_SOFT_BG,
  color: BRAND_TEXT,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const secondaryButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid #E5E7EB",
  background: "#fff",
  color: "#374151",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const addFieldButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 13px",
  borderRadius: 9,
  fontSize: 12,
  fontWeight: 700,
  border: "1px solid #E5E7EB",
  background: "#fff",
  color: BRAND_TEXT,
  cursor: "pointer",
};

const iconButtonStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 10,
  border: "1px solid #E5E7EB",
  background: "#fff",
  color: "#6B7280",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const iconButtonStyleSm: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: "1px solid #E5E7EB",
  background: "#fff",
  color: "#6B7280",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#6B7280",
  marginBottom: 6,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "9px 11px",
  borderRadius: 9,
  border: "1px solid #E5E7EB",
  fontSize: 13,
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
  fontFamily: "inherit",
};