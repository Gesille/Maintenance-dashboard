"use client";

import { useMemo, useState } from "react";
import { Search, Plus, AlertTriangle } from "lucide-react";
import { Part } from "@/types/Part";


interface Props {
  parts: Part[];
  selectedId: number | null;
  onSelect: (part: Part) => void;
  onNew: () => void;
}

type Tab = "all" | "low";

export function PartListPanel({ parts, selectedId, onSelect, onNew }: Props) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");

  const lowStockCount = useMemo(
    () => parts.filter((p) => p.isLowStock ?? p.quantityOnHand <= p.minQuantity).length,
    [parts],
  );

  const filtered = parts.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      search === "" ||
      p.name.toLowerCase().includes(q) ||
      p.partNumber?.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q);
    const isLow = p.isLowStock ?? p.quantityOnHand <= p.minQuantity;
    const matchesTab = tab === "all" ? true : isLow;
    return matchesSearch && matchesTab;
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
              Parts Inventory
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 11, color: "#64748B" }}>{parts.length} parts</span>
              {lowStockCount > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    background: "#FEF2F2",
                    color: "#DC2626",
                    border: "1px solid #FECACA",
                    padding: "1px 7px",
                    borderRadius: 99,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <AlertTriangle size={9} strokeWidth={2.5} />
                  {lowStockCount} low stock
                </span>
              )}
            </div>
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
            marginBottom: 12,
            border: "1.5px solid #E0E7FF",
            transition: "border-color 0.15s",
          }}
          onFocusCapture={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "#6366F1")}
          onBlurCapture={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "#E0E7FF")}
        >
          <Search size={13} color="#A5B4FC" strokeWidth={2} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search parts, part #, barcode…"
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

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0 }}>
          {(
            [
              { key: "all", label: "All" },
              { key: "low", label: "Low stock" },
            ] as { key: Tab; label: string }[]
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "9px 16px",
                fontSize: 12,
                fontWeight: tab === t.key ? 700 : 400,
                color: tab === t.key ? "#6366F1" : "#94A3B8",
                background: "none",
                border: "none",
                borderBottom: `2.5px solid ${tab === t.key ? "#6366F1" : "transparent"}`,
                cursor: "pointer",
                marginBottom: -1,
                letterSpacing: "-0.01em",
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px 16px" }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "56px 20px", color: "#94A3B8", fontSize: 13 }}>
            <i
              className="ti ti-box-seam"
              style={{ fontSize: 36, color: "#E0E7FF", display: "block", marginBottom: 10 }}
            />
            No parts found
          </div>
        )}
        {filtered.map((part) => {
          const isSelected = part.id === selectedId;
          const isLow = part.isLowStock ?? part.quantityOnHand <= part.minQuantity;

          return (
            <div
              key={part.id}
              onClick={() => onSelect(part)}
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
                    background: "#F9FAFB",
                    color: "#374151",
                    padding: "2px 8px",
                    borderRadius: 99,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {part.category ?? "General"}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: isSelected ? "#818CF8" : "#CBD5E1",
                    fontFamily: "monospace",
                    fontWeight: 600,
                  }}
                >
                  #{part.id}
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
                {part.name}
              </p>

              <p
                style={{
                  fontSize: 11,
                  color: "#94A3B8",
                  margin: "0 0 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {part.partNumber ? `#${part.partNumber}` : "No part number"}
                {part.location && (
                  <>
                    <span style={{ color: "#E2E8F0" }}>·</span>
                    {part.location}
                  </>
                )}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isLow ? "#DC2626" : "#334155",
                  }}
                >
                  {part.quantityOnHand} {part.unitOfMeasure}
                </span>
                <span style={{ fontSize: 10, color: "#CBD5E1" }}>
                  (min {part.minQuantity})
                </span>
                {isLow && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 10,
                      fontWeight: 700,
                      background: "#FEF2F2",
                      color: "#DC2626",
                      border: "1px solid #FECACA",
                      padding: "2px 7px",
                      borderRadius: 99,
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <AlertTriangle size={9} strokeWidth={2.5} />
                    Low
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}