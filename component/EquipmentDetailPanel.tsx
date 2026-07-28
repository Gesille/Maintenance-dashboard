/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { Edit3, Trash2, X, Save, Loader, MapPin, Tag, Wrench } from "lucide-react";
import { Equipment, EquipmentFormInput, EMPTY_EQUIPMENT_FORM } from "@/types/equipment";
import { CATEGORY_COLORS } from "@/types/tokens";

type Mode = "view" | "edit" | "create";

interface Props {
  equipment: Equipment | null;
  mode: Mode;
  saving: boolean;
  deleting: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (data: EquipmentFormInput) => void;
  onDelete: () => void;
}

const accentColor = "#6366F1";

const FIELD_GROUPS: { title: string; fields: { key: keyof EquipmentFormInput; label: string; type?: string }[] }[] = [
  {
    title: "Basic info",
    fields: [
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "usedInLocation", label: "Location" },
      { key: "restaurant", label: "Restaurant / Site" },
      { key: "description", label: "Description" },
    ],
  },
  {
    title: "Assignment",
    fields: [
      { key: "maintenanceTeam", label: "Maintenance team" },
      { key: "technician", label: "Technician" },
      { key: "owner", label: "Owner" },
    ],
  },
  {
    title: "Identification",
    fields: [
      { key: "assetCode", label: "Asset code" },
      { key: "reference", label: "Reference" },
      { key: "model", label: "Model" },
      { key: "serialNumber", label: "Serial number" },
    ],
  },
  {
    title: "Vendor & cost",
    fields: [
      { key: "vendor", label: "Vendor" },
      { key: "vendorReference", label: "Vendor reference" },
      { key: "cost", label: "Cost", type: "number" },
    ],
  },
  {
    title: "Dates",
    fields: [
      { key: "assignedDate", label: "Assigned date", type: "date" },
      { key: "effectiveDate", label: "Effective date", type: "date" },
      { key: "warrantyExpirationDate", label: "Warranty expiration", type: "date" },
      { key: "scrapDate", label: "Scrap date", type: "date" },
    ],
  },
];

function toFormInput(eq: Equipment | null): EquipmentFormInput {
  if (!eq) return EMPTY_EQUIPMENT_FORM;
  const { id, active, createdAt, updatedAt, ...rest } = eq;
  return rest;
}

export function EquipmentDetailPanel({
  equipment,
  mode,
  saving,
  deleting,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: Props) {
  const [form, setForm] = useState<EquipmentFormInput>(toFormInput(equipment));
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    setForm(toFormInput(equipment));
    setConfirmingDelete(false);
  }, [equipment, mode]);

  const isFormMode = mode === "edit" || mode === "create";
  const category = CATEGORY_COLORS[equipment?.category ?? "General"] ?? CATEGORY_COLORS["General"];

  const handleField = (key: keyof EquipmentFormInput, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: key === "cost" ? Number(value) || 0 : value === "" ? null : value,
    }));
  };

  const handleSubmit = () => {
    if (!form.name?.trim()) return;
    onSave(form);
  };

  if (!equipment && mode === "view") {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94A3B8",
          fontSize: 13,
          background: "#fff",
        }}
      >
        Select equipment to view details, or create a new one.
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff" }}>
      {/* Hero header */}
      <div
        style={{
          background: "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 60%, #FAF5FF 100%)",
          borderBottom: `2px solid ${accentColor}22`,
          padding: "24px 32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {mode === "view" && equipment && (
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
                  marginBottom: 10,
                  display: "inline-block",
                }}
              >
                {equipment.category ?? "General"}
              </span>
            )}
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#0F172A",
                margin: "0 0 4px",
                letterSpacing: "-0.03em",
              }}
            >
              {mode === "create" ? "New equipment" : equipment?.name}
            </h2>
            {mode !== "create" && equipment && (
              <span style={{ fontSize: 11, color: "#A5B4FC", fontFamily: "monospace", fontWeight: 600 }}>
                #{equipment.id}
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {mode === "view" && (
              <>
                <HeaderBtn icon={<Edit3 size={13} />} label="Edit" onClick={onEdit} />
                <HeaderBtn
                  icon={<Trash2 size={13} />}
                  label="Delete"
                  danger
                  onClick={() => setConfirmingDelete(true)}
                />
              </>
            )}
            {isFormMode && (
              <>
                <HeaderBtn icon={<X size={13} />} label="Cancel" onClick={onCancelEdit} />
                <HeaderBtn
                  icon={saving ? <Loader size={13} style={{ animation: "spin 0.7s linear infinite" }} /> : <Save size={13} />}
                  label={saving ? "Saving…" : "Save"}
                  primary
                  onClick={handleSubmit}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: "#E8EAFF" }} />

      {/* Delete confirm bar */}
      {confirmingDelete && (
        <div
          style={{
            background: "#FEF2F2",
            borderBottom: "1px solid #FECACA",
            padding: "12px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 13, color: "#7F1D1D", fontWeight: 500 }}>
            Delete this equipment permanently? This can&apos;t be undone.
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setConfirmingDelete(false)}
              style={{
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                background: "#fff",
                border: "1px solid #FECACA",
                borderRadius: 8,
                color: "#7F1D1D",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              style={{
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                background: "#DC2626",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                cursor: deleting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {deleting && <Loader size={12} style={{ animation: "spin 0.7s linear infinite" }} />}
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", background: "#FAFBFF" }}>
        {isFormMode ? (
          FIELD_GROUPS.map((group) => (
            <div key={group.title} style={{ marginBottom: 24 }}>
              <SectionLabel label={group.title} />
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #E8EAFF",
                  borderRadius: 14,
                  padding: "16px 20px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                  boxShadow: "0 1px 4px rgba(99,102,241,0.05)",
                }}
              >
                {group.fields.map((f) => (
                  <div
                    key={f.key}
                    style={{ gridColumn: f.key === "description" ? "1 / -1" : undefined }}
                  >
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#64748B",
                        display: "block",
                        marginBottom: 5,
                      }}
                    >
                      {f.label}
                      {f.key === "name" && <span style={{ color: "#DC2626" }}> *</span>}
                    </label>
                    {f.key === "description" ? (
                      <textarea
                        value={(form[f.key] as string) ?? ""}
                        onChange={(e) => handleField(f.key, e.target.value)}
                        rows={3}
                        style={inputStyle()}
                      />
                    ) : (
                      <input
                        type={f.type ?? "text"}
                        value={(form[f.key] as string | number) ?? ""}
                        onChange={(e) => handleField(f.key, e.target.value)}
                        style={inputStyle()}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          equipment && (
            <>
              <SectionLabel label="Details" />
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
                <EquipRow icon={<MapPin size={13} color="#A5B4FC" />} label="Location" value={equipment.usedInLocation} />
                <EquipRow icon={<Tag size={13} color="#A5B4FC" />} label="Restaurant" value={equipment.restaurant} divider />
                <EquipRow icon={<Wrench size={13} color="#A5B4FC" />} label="Team" value={equipment.maintenanceTeam} divider />
                <EquipRow icon={<i className="ti ti-user" style={{ fontSize: 13, color: "#A5B4FC" }} />} label="Technician" value={equipment.technician} divider />
                <EquipRow icon={<i className="ti ti-user-star" style={{ fontSize: 13, color: "#A5B4FC" }} />} label="Owner" value={equipment.owner} divider />
                <EquipRow icon={<i className="ti ti-barcode" style={{ fontSize: 13, color: "#A5B4FC" }} />} label="Asset code" value={equipment.assetCode} divider />
                <EquipRow icon={<i className="ti ti-versions" style={{ fontSize: 13, color: "#A5B4FC" }} />} label="Model" value={equipment.model} divider />
                <EquipRow icon={<i className="ti ti-hash" style={{ fontSize: 13, color: "#A5B4FC" }} />} label="Serial no." value={equipment.serialNumber} divider />
                <EquipRow icon={<i className="ti ti-building-store" style={{ fontSize: 13, color: "#A5B4FC" }} />} label="Vendor" value={equipment.vendor} divider />
                <EquipRow icon={<i className="ti ti-currency-dollar" style={{ fontSize: 13, color: "#A5B4FC" }} />} label="Cost" value={equipment.cost ? `$${equipment.cost}` : null} divider />
                <EquipRow icon={<i className="ti ti-shield-check" style={{ fontSize: 13, color: "#A5B4FC" }} />} label="Warranty exp." value={equipment.warrantyExpirationDate} divider />
                <EquipRow icon={<i className="ti ti-currency-dollar" style={{ fontSize: 13, color: "#A5B4FC" }} />} label="Cost" value={equipment.cost ? `$${equipment.cost}` : null} divider />
<EquipRow icon={<i className="ti ti-calendar-event" style={{ fontSize: 13, color: "#A5B4FC" }} />} label="Assigned date" value={equipment.assignedDate} divider />
<EquipRow icon={<i className="ti ti-calendar-check" style={{ fontSize: 13, color: "#A5B4FC" }} />} label="Effective date" value={equipment.effectiveDate} divider />
<EquipRow icon={<i className="ti ti-shield-check" style={{ fontSize: 13, color: "#A5B4FC" }} />} label="Warranty exp." value={equipment.warrantyExpirationDate} divider />
<EquipRow icon={<i className="ti ti-calendar-x" style={{ fontSize: 13, color: "#A5B4FC" }} />} label="Scrap date" value={equipment.scrapDate} divider />
              </div>

              <SectionLabel label="Description" />
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #E8EAFF",
                  borderRadius: 14,
                  padding: "16px 20px",
                  boxShadow: "0 1px 4px rgba(99,102,241,0.05)",
                }}
              >
                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap" }}>
                  {equipment.description || "No description provided."}
                </p>
              </div>
            </>
          )
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    boxSizing: "border-box",
    fontSize: 13,
    padding: "9px 11px",
    borderRadius: 9,
    border: "1.5px solid #E8EAFF",
    background: "#FAFBFF",
    color: "#334155",
    outline: "none",
    fontFamily: "inherit",
  };
}

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

function EquipRow({
  icon,
  label,
  value,
  divider = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
  divider?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "11px 18px", borderTop: divider ? "1px solid #F0F4FF" : "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: 140, flexShrink: 0 }}>
        {icon}
        <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </span>
      </div>
      <span style={{ fontSize: 13, color: "#1E293B", fontWeight: 500, letterSpacing: "-0.01em" }}>
        {value || "—"}
      </span>
    </div>
  );
}

function HeaderBtn({
  icon,
  label,
  onClick,
  primary,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 13px",
        fontSize: 12,
        fontWeight: 600,
        color: primary ? "#fff" : danger ? "#DC2626" : "#64748B",
        background: primary
          ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
          : "#fff",
        border: `1.5px solid ${primary ? "transparent" : danger ? "#FECACA" : "#E8EAFF"}`,
        borderRadius: 9,
        cursor: "pointer",
        letterSpacing: "-0.01em",
      }}
    >
      {icon}
      {label}
    </button>
  );
}