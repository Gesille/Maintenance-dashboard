/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useEffect, useState } from "react";
import { CardShell } from "../shared/CardShell";

import { renderCard, FULL_WIDTH_CARDS } from "./CardRenderer";
import type { ReportingSummary } from "@/redux/Reporting/Reportingapi";
import { CardId, CUSTOM_DASHBOARD_STORAGE_KEY, ALL_CARD_IDS, CARD_LABELS } from "@/types/tokens";


export function CustomDashboardsPanel({ data }: { data: ReportingSummary }) {
  const [selected, setSelected] = useState<CardId[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_DASHBOARD_STORAGE_KEY);
      setSelected(raw ? (JSON.parse(raw) as CardId[]) : [...ALL_CARD_IDS]);
    } catch {
      setSelected([...ALL_CARD_IDS]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(CUSTOM_DASHBOARD_STORAGE_KEY, JSON.stringify(selected));
  }, [selected, hydrated]);

  function toggle(id: CardId) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  if (!hydrated) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <CardShell title="Choose your widgets">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ALL_CARD_IDS.map((id) => {
            const active = selected.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                style={{
                  fontSize: 12, fontWeight: 600, padding: "7px 12px", borderRadius: 99,
                  border: active ? "1px solid #6366F1" : "1px solid #E2E8F0",
                  background: active ? "#EEF2FF" : "#fff", color: active ? "#4F46E5" : "#64748B",
                  cursor: "pointer",
                }}
              >
                {CARD_LABELS[id]}
              </button>
            );
          })}
        </div>
      </CardShell>

      {selected.length === 0 ? (
        <CardShell title="Your dashboard">
          <p style={{ fontSize: 12.5, color: "#94A3B8", margin: 0 }}>
            Pick at least one widget above to build your custom dashboard.
          </p>
        </CardShell>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {selected.map((id) =>
            FULL_WIDTH_CARDS.includes(id) ? (
              <div key={id} style={{ gridColumn: "1 / -1" }}>
                {renderCard(id, data)}
              </div>
            ) : (
              <div key={id}>{renderCard(id, data)}</div>
            ),
          )}
        </div>
      )}
    </div>
  );
}