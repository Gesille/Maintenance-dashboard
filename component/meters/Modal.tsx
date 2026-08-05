"use client";

import { ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: number;
  children: ReactNode;
}

export function Modal({ open, onClose, title, subtitle, width = 480, children }: Props) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17, 24, 39, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: width,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 24px 60px rgba(17,24,39,0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "20px 22px 14px",
            borderBottom: "1px solid #F0F0F2",
          }}
        >
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.01em" }}>
              {title}
            </h2>
            {subtitle && <p style={{ fontSize: 12.5, color: "#9CA3AF", margin: "4px 0 0" }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              border: "1px solid #E5E7EB",
              background: "#fff",
              color: "#6B7280",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <i className="ti ti-x" style={{ fontSize: 14 }} aria-hidden="true" />
          </button>
        </div>

        <div style={{ padding: "18px 22px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

// ── Shared field styles, reused across the meter modals ──────────────────────

export const fieldLabel: React.CSSProperties = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
};

export const fieldInput: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 10,
  border: "1px solid #E5E7EB",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  background: "#FAFAFB",
  fontFamily: "inherit",
};

export const primaryButton: React.CSSProperties = {
  padding: "10px 18px",
  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
  color: "#fff",
  border: "none",
  borderRadius: 11,
  fontSize: 13.5,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 6px 16px rgba(99,102,241,0.3)",
};

export const secondaryButton: React.CSSProperties = {
  padding: "10px 16px",
  background: "#fff",
  color: "#374151",
  border: "1px solid #E5E7EB",
  borderRadius: 11,
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};