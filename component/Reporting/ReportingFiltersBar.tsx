"use client";
import { useState } from "react";
import { UserPlus, CalendarDays, MapPin, Flag, X } from "lucide-react";
import { FilterChip } from "../shared/FilterChip";

export interface ReportingFilterState {
  technicianId?: string;
  technicianName?: string;
  restaurant?: string;
  priority?: string;
  dueStart?: string;
  dueEnd?: string;
}

export function ReportingFiltersBar({
  value,
  onChange,
  technicianOptions,
  locationOptions,
}: {
  value: ReportingFilterState;
  onChange: (next: ReportingFilterState) => void;
  technicianOptions: { id: string; name: string }[];
  locationOptions: string[];
}) {
  const [open, setOpen] = useState<"technician" | "due" | "location" | "priority" | null>(null);

  function set(patch: Partial<ReportingFilterState>) {
    onChange({ ...value, ...patch });
    setOpen(null);
  }

  const hasAny = Object.values(value).some(Boolean);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", position: "relative" }}>
        <div style={{ position: "relative" }}>
          <FilterChip
            icon={<UserPlus size={14} />}
            label={value.technicianName ?? "Assigned to"}
            onClick={() => setOpen(open === "technician" ? null : "technician")}
          />
          {open === "technician" && (
            <div style={dropdownStyle}>
              {technicianOptions.length === 0 && <div style={emptyStyle}>No technicians in range</div>}
              {technicianOptions.map((t) => (
                <button key={t.id} style={optionStyle} onClick={() => set({ technicianId: t.id, technicianName: t.name })}>
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <FilterChip
            icon={<CalendarDays size={14} />}
            label={value.dueStart || value.dueEnd ? "Due date set" : "Due Date"}
            onClick={() => setOpen(open === "due" ? null : "due")}
          />
          {open === "due" && (
            <div style={{ ...dropdownStyle, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={labelStyle}>
                From
                <input type="date" style={inputStyle} value={value.dueStart ?? ""} onChange={(e) => onChange({ ...value, dueStart: e.target.value || undefined })} />
              </label>
              <label style={labelStyle}>
                To
                <input type="date" style={inputStyle} value={value.dueEnd ?? ""} onChange={(e) => onChange({ ...value, dueEnd: e.target.value || undefined })} />
              </label>
              <button style={applyStyle} onClick={() => setOpen(null)}>Apply</button>
            </div>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <FilterChip
            icon={<MapPin size={14} />}
            label={value.restaurant ?? "Location"}
            onClick={() => setOpen(open === "location" ? null : "location")}
          />
          {open === "location" && (
            <div style={dropdownStyle}>
              {locationOptions.length === 0 && <div style={emptyStyle}>No locations in range</div>}
              {locationOptions.map((loc) => (
                <button key={loc} style={optionStyle} onClick={() => set({ restaurant: loc })}>{loc}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <FilterChip
            icon={<Flag size={14} />}
            label={value.priority ? value.priority[0].toUpperCase() + value.priority.slice(1) : "Priority"}
            onClick={() => setOpen(open === "priority" ? null : "priority")}
          />
          {open === "priority" && (
            <div style={dropdownStyle}>
              {["high", "medium", "low"].map((p) => (
                <button key={p} style={optionStyle} onClick={() => set({ priority: p })}>
                  {p[0].toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {hasAny && (
          <button
            onClick={() => onChange({})}
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 600, color: "#94A3B8", background: "transparent", border: "none", cursor: "pointer", padding: "7px 4px" }}
          >
            <X size={13} /> Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

const dropdownStyle: React.CSSProperties = {
  position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 180, background: "#fff",
  border: "1px solid #E2E8F0", borderRadius: 10, boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
  zIndex: 20, padding: 6, display: "flex", flexDirection: "column", gap: 2,
};
const optionStyle: React.CSSProperties = {
  textAlign: "left", fontSize: 12.5, padding: "7px 10px", borderRadius: 6, border: "none",
  background: "transparent", cursor: "pointer", color: "#0F172A",
};
const emptyStyle: React.CSSProperties = { fontSize: 12, color: "#94A3B8", padding: "6px 10px" };
const labelStyle: React.CSSProperties = { fontSize: 11.5, color: "#64748B", display: "flex", flexDirection: "column", gap: 4 };
const inputStyle: React.CSSProperties = { fontSize: 12.5, padding: "6px 8px", borderRadius: 6, border: "1px solid #E2E8F0" };
const applyStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#fff", background: "#6366F1", border: "none", borderRadius: 6, padding: "7px 0", cursor: "pointer" };