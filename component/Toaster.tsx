"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { Toast } from "@/types/useToast";


const CONFIG = {
  success: {
    bg: "#F0FDF4",
    border: "#BBF7D0",
    icon: CheckCircle,
    color: "#16A34A",
    bar: "#22C55E",
  },
  error: {
    bg: "#FEF2F2",
    border: "#FECACA",
    icon: XCircle,
    color: "#DC2626",
    bar: "#EF4444",
  },
  warning: {
    bg: "#FFFBEB",
    border: "#FDE68A",
    icon: AlertCircle,
    color: "#D97706",
    bar: "#F59E0B",
  },
  info: {
    bg: "#EFF6FF",
    border: "#BFDBFE",
    icon: Info,
    color: "#2563EB",
    bar: "#3B82F6",
  },
};

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const cfg = CONFIG[toast.type];
  const Icon = cfg.icon;

  useEffect(() => {
    // mount animation
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleRemove = () => {
    setVisible(false);
    setTimeout(() => onRemove(toast.id), 250);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: "8px",
        padding: "14px 14px 14px 16px",
        boxShadow:
          "0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)",
        minWidth: "300px",
        maxWidth: "380px",
        position: "relative",
        overflow: "hidden",
        transform: visible ? "translateX(0)" : "translateX(110%)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.25s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease",
      }}
    >
      {/* left accent bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "3px",
          background: cfg.bar,
          borderRadius: "8px 0 0 8px",
        }}
      />
      <Icon size={18} color={cfg.color} style={{ flexShrink: 0, marginTop: "1px" }} />
      <p
        style={{
          margin: 0,
          fontSize: "13.5px",
          fontWeight: 500,
          color: "#111827",
          lineHeight: 1.5,
          flex: 1,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {toast.message}
      </p>
      <button
        onClick={handleRemove}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#9CA3AF",
          padding: "0",
          display: "flex",
          flexShrink: 0,
          marginTop: "1px",
        }}
      >
        <X size={15} />
      </button>
    </div>
  );
}

export function Toaster({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: "auto" }}>
          <ToastItem toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}