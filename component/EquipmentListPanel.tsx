"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Equipment } from "@/types/equipment";
import { CATEGORY_COLORS } from "@/types/tokens";

interface Props {
  equipment: Equipment[];
  selectedId: number | null;
  onSelect: (eq: Equipment) => void;
  onNew: () => void;
}

export function EquipmentListPanel({ equipment, selectedId, onSelect, onNew }: Props) {
  const [search, setSearch] = useState("");

  const filtered = equipment.filter((e) => {
    const q = search.toLowerCase();
    return (
      search === "" ||
      e.name.toLowerCase().includes(q) ||
      e.assetCode?.toLowerCase().includes(q) ||
      e.serialNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div
      style={{
        width: 312,
        flexShrink: 0,
        borderRight: "1px solid #E8EAFF",
        display: "flex",
        flexDirection: "column",
        background: "#F8FAFF",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 16px 0",
          background: "#fff",
          borderBottom: "1px solid #E8EAFF",
          boxShadow: "0 1px 0 #E8EAFF",
          paddingBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#0F172A",
                margin: 0,
                letterSpacing: "-0.025em",
              }}
            >
              Equipment
            </h1>
            <span style={{ fontSize: 11, color: "#64748B", marginTop: 4, display: "block" }}>
              {equipment.length} assets
            </span>
          </div>
          <button
            onClick={onNew}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "8px 14px",
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "-0.01em",
              boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 6px 18px rgba(99,102,241,0.5)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 4px 12px rgba(99,102,241,0.35)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            <Plus size={13} strokeWidth={2.5} /> New
          </button>
        </div>

        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#F8FAFF",
            borderRadius: 10,
            padding: "0 12px",
            height: 36,
            border: "1.5px solid #E0E7FF",
            transition: "border-color 0.15s",
          }}
          onFocusCapture={(e) =>
            ((e.currentTarget as HTMLDivElement).style.borderColor = "#6366F1")
          }
          onBlurCapture={(e) =>
            ((e.currentTarget as HTMLDivElement).style.borderColor = "#E0E7FF")
          }
        >
          <Search size={13} color="#A5B4FC" strokeWidth={2} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search equipment…"
            style={{
              border: "none",
              background: "transparent",
              fontSize: 12,
              color: "#0F172A",
              outline: "none",
              width: "100%",
            }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px 16px" }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "56px 20px", color: "#94A3B8", fontSize: 13 }}>
            <i
              className="ti ti-building-factory-2"
              style={{ fontSize: 36, color: "#E0E7FF", display: "block", marginBottom: 10 }}
            />
            No equipment found
          </div>
        )}
        {filtered.map((eq) => {
          const catMeta = CATEGORY_COLORS[eq.category ?? "General"] ?? CATEGORY_COLORS["General"];
          const isSelected = eq.id === selectedId;

          return (
            <div
              key={eq.id}
              onClick={() => onSelect(eq)}
              style={{
                padding: "13px 14px",
                borderRadius: 12,
                border: `1.5px solid ${isSelected ? "#6366F1" : "#EEF0FF"}`,
                background: isSelected
                  ? "linear-gradient(145deg, #F5F3FF 0%, #EEF2FF 100%)"
                  : "#fff",
                marginBottom: 6,
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: isSelected
                  ? "0 0 0 3px rgba(99,102,241,0.12), 0 2px 8px rgba(99,102,241,0.1)"
                  : "0 1px 3px rgba(15,23,42,0.04)",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 4px 12px rgba(99,102,241,0.1)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#C7D2FE";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 1px 3px rgba(15,23,42,0.04)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#EEF0FF";
                }
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 7,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    background: catMeta.bg,
                    color: catMeta.text,
                    padding: "2px 8px",
                    borderRadius: 99,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {eq.category ?? "General"}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: isSelected ? "#818CF8" : "#CBD5E1",
                    fontFamily: "monospace",
                    fontWeight: 600,
                  }}
                >
                  #{eq.id}
                </span>
              </div>

              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: isSelected ? "#3730A3" : "#0F172A",
                  margin: "0 0 5px",
                  lineHeight: 1.4,
                  letterSpacing: "-0.015em",
                }}
              >
                {eq.name}
              </p>

              <p
                style={{
                  fontSize: 11,
                  color: "#94A3B8",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <i className="ti ti-map-pin" style={{ fontSize: 11 }} aria-hidden="true" />
                {eq.usedInLocation || "No location"}
                {eq.assetCode && (
                  <>
                    <span style={{ color: "#E2E8F0" }}>·</span>
                    {eq.assetCode}
                  </>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}