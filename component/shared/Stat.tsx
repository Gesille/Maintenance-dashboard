"use client";

export function Stat({
  value,
  label,
  swatch,
}: {
  value: string | number;
  label: string;
  swatch?: string;
}) {
  return (
    <div>
      <p style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>
        {value}
      </p>
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600,
          color: "#64748B", background: "#F8FAFF", border: "1px solid #EEF0FF", borderRadius: 6,
          padding: "3px 8px", marginTop: 6,
        }}
      >
        {swatch && <span style={{ width: 7, height: 7, borderRadius: "50%", background: swatch, flexShrink: 0 }} />}
        {label}
      </span>
    </div>
  );
}