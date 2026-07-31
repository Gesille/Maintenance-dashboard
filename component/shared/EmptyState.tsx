"use client";

export function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 100, fontSize: 12, color: "#C7D2FE", fontWeight: 600 }}>
      {label}
    </div>
  );
}