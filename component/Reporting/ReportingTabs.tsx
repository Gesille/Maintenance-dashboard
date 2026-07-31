"use client";
import { TABS } from "./reporting.tokens";

export function ReportingTabs({
  activeTab,
  onChange,
}: {
  activeTab: (typeof TABS)[number];
  onChange: (tab: (typeof TABS)[number]) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 22, borderBottom: "1px solid #E8EAFF", marginBottom: 18 }}>
      {TABS.map((tab) => {
        const active = tab === activeTab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: "0 0 11px",
              fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#4F46E5" : "#94A3B8",
              borderBottom: active ? "2px solid #6366F1" : "2px solid transparent", letterSpacing: "-0.01em",
            }}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}