"use client";
import { UserPlus, CalendarDays, MapPin, Flag, Plus, Star } from "lucide-react";
import { FilterChip } from "../shared/FilterChip";


export function ReportingFiltersBar() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <FilterChip icon={<UserPlus size={13.5} />} label="Assigned to" />
        <FilterChip icon={<CalendarDays size={13.5} />} label="Due Date" />
        <FilterChip icon={<MapPin size={13.5} />} label="Location" />
        <FilterChip icon={<Flag size={13.5} />} label="Priority" />
        <button
          style={{
            display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600,
            color: "#6366F1", background: "transparent", border: "none", cursor: "pointer", padding: "7px 4px",
          }}
        >
          <Plus size={14} />
          Add filter
        </button>
      </div>

      <button
        style={{
          display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600,
          color: "#475569", background: "transparent", border: "none", cursor: "pointer",
        }}
      >
        <Star size={14} color="#C7D2FE" />
        My Filters
      </button>
    </div>
  );
}