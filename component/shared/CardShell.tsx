
"use client";

import { Plus } from "lucide-react";

export function CardShell({
  title,
  subtitle,
  children,
  onAdd,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onAdd?: boolean;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #EEF0FF",
        borderRadius: 16,
        padding: "18px 20px 20px",
        boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
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
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: "#0F172A",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </div>

          {subtitle && (
            <div
              style={{
                marginTop: 3,
                fontSize: 11.5,
                fontWeight: 500,
                color: "#94A3B8",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {onAdd && (
          <button
            type="button"
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              border: "1px solid #E8EAFF",
              background: "#FAFBFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#6366F1",
              flexShrink: 0,
            }}
            aria-label={`Add to ${title}`}
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {children}
    </div>
  );
}

