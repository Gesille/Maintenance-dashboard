"use client";

export function FilterChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      style={{
        display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 500,
        color: "#475569", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 9,
        padding: "7px 12px", cursor: "pointer",
      }}
    >
      {icon}
      {label}
    </button>
  );
}