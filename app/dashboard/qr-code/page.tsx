// app/dashboard/qr-code/page.tsx
"use client";

import { useMemo, useState } from "react";
import { Search, QrCode, Download, RefreshCw, Sparkles } from "lucide-react";
import { WorkOrderSidebar } from "@/component/Sidebar";
import { Toaster } from "@/component/Toaster";
import { useToast } from "@/types/useToast";
import { Equipment } from "@/types/equipment";
import {
  useGenerateEquipmentQrMutation,
  useGenerateMissingQrsMutation,
  useGetAllEquipmentQuery,
} from "@/redux/Equipment/Equipmentapi";

// Adjust this to wherever your app already reads the API base URL from
const API_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? "";

export default function QRCodePage() {
  const { data, isLoading, isError, refetch } = useGetAllEquipmentQuery();
  const [generateOne, { isLoading: generatingOne }] = useGenerateEquipmentQrMutation();
  const [generateMissing, { isLoading: generatingMissing }] = useGenerateMissingQrsMutation();
  const { toasts, addToast, removeToast } = useToast();

  const [search, setSearch] = useState("");
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  const list: Equipment[] = data?.data ?? [];
  const missingCount = list.filter((e) => !e.qrGenerated || !e.qrCodeUrl).length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return list.filter(
      (e) =>
        q === "" ||
        e.name.toLowerCase().includes(q) ||
        e.assetCode?.toLowerCase().includes(q),
    );
  }, [list, search]);

  const handleGenerateOne = async (id: number) => {
    setGeneratingId(id);
    try {
      await generateOne(id).unwrap();
      addToast("QR code generated", "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to generate QR code", "error");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleGenerateMissing = async () => {
    try {
      const res = await generateMissing().unwrap();
      addToast(`Generated ${res.data.length} QR code(s)`, "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to generate missing QR codes", "error");
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#F8FAFF" }}>
        <span style={{ fontSize: 13, color: "#94A3B8" }}>Loading equipment…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", alignItems: "center", justifyContent: "center", background: "#FFF5F5", gap: 12 }}>
        <span style={{ fontSize: 13, color: "#DC2626" }}>Failed to load equipment</span>
        <button
          onClick={refetch}
          style={{
            padding: "8px 18px",
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            color: "#fff",
            border: "none",
            borderRadius: 9,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8FAFF" }}>
      <WorkOrderSidebar />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 60%, #FAF5FF 100%)",
            borderBottom: "2px solid #6366F122",
            padding: "24px 32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 18 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: "0 0 4px", letterSpacing: "-0.03em" }}>
                QR Codes
              </h1>
              <span style={{ fontSize: 12, color: "#64748B" }}>
                {list.length} assets · {missingCount > 0 ? `${missingCount} missing QR` : "all generated"}
              </span>
            </div>

            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              {missingCount > 0 && (
                <HeaderBtn
                  icon={<Sparkles size={13} />}
                  label={generatingMissing ? "Generating…" : `Generate missing (${missingCount})`}
                  primary
                  disabled={generatingMissing}
                  onClick={handleGenerateMissing}
                />
              )}
              <a href={`${API_URL}/get-all-qr`} style={{ textDecoration: "none" }}>
                <HeaderBtn icon={<Download size={13} />} label="Print all" />
              </a>
            </div>
          </div>

          {/* Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
              borderRadius: 10,
              padding: "0 12px",
              height: 36,
              border: "1.5px solid #E0E7FF",
              maxWidth: 360,
            }}
          >
            <Search size={13} color="#A5B4FC" strokeWidth={2} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search equipment…"
              style={{ border: "none", background: "transparent", fontSize: 12, color: "#0F172A", outline: "none", width: "100%" }}
            />
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "#94A3B8", fontSize: 13 }}>
              <QrCode size={36} color="#E0E7FF" style={{ display: "block", margin: "0 auto 10px" }} />
              No equipment found
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 16,
              }}
            >
              {filtered.map((eq) => (
                <QRCard
                  key={eq.id}
                  equipment={eq}
                  busy={generatingId === eq.id && generatingOne}
                  onGenerate={() => handleGenerateOne(eq.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Toaster toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

// ── QR card ─────────────────────────────────────────────────────────────────

function QRCard({
  equipment,
  busy,
  onGenerate,
}: {
  equipment: Equipment;
  busy: boolean;
  onGenerate: () => void;
}) {
  const hasQR = !!equipment.qrGenerated && !!equipment.qrCodeUrl;

  return (
    <div
      style={{
        background: "#fff",
        border: "1.5px solid #EEF0FF",
        borderRadius: 14,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
      }}
    >
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: 10,
          background: hasQR ? "#fff" : "#F8FAFF",
          border: "1px solid #E8EAFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
          overflow: "hidden",
        }}
      >
        {hasQR ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={equipment.qrCodeUrl!}
            alt={`QR for ${equipment.name}`}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          <QrCode size={40} color="#CBD5E1" />
        )}
      </div>

      <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: "0 0 2px", textAlign: "center" }}>
        {equipment.name}
      </p>
      <span style={{ fontSize: 11, color: "#94A3B8", marginBottom: 12 }}>
        {equipment.assetCode || `#${equipment.id}`}
      </span>

      <div style={{ display: "flex", gap: 6, width: "100%" }}>
        {hasQR ? (
          <>
            <a href={`${API_URL}/get-qr/${equipment.id}`} style={{ flex: 1, textDecoration: "none" }}>
              <SmallBtn icon={<Download size={12} />} label="Download" />
            </a>
            <SmallBtn
              icon={<RefreshCw size={12} />}
              label=""
              onClick={onGenerate}
              disabled={busy}
              title="Regenerate"
            />
          </>
        ) : (
          <SmallBtn
            icon={<Sparkles size={12} />}
            label={busy ? "Generating…" : "Generate"}
            onClick={onGenerate}
            disabled={busy}
            full
            primary
          />
        )}
      </div>
    </div>
  );
}

// ── Buttons ────────────────────────────────────────────────────────────────

function HeaderBtn({
  icon,
  label,
  onClick,
  primary,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        fontSize: 12,
        fontWeight: 600,
        color: primary ? "#fff" : "#64748B",
        background: primary ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "#fff",
        border: `1.5px solid ${primary ? "transparent" : "#E8EAFF"}`,
        borderRadius: 9,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        letterSpacing: "-0.01em",
        boxShadow: primary ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function SmallBtn({
  icon,
  label,
  onClick,
  disabled,
  primary,
  full,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  primary?: boolean;
  full?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        flex: full ? 1 : undefined,
        padding: label ? "7px 10px" : "7px",
        fontSize: 11,
        fontWeight: 600,
        color: primary ? "#fff" : "#64748B",
        background: primary ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "#fff",
        border: `1.5px solid ${primary ? "transparent" : "#E8EAFF"}`,
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {icon}
      {label}
    </button>
  );
}