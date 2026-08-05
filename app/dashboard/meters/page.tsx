"use client";

import { useCallback, useMemo, useState } from "react";
import { WorkOrderSidebar } from "@/component/Sidebar";

import {
  Meter,
  MeterTrigger,
  useAddMeterTriggerMutation,
  useCreateMeterMutation,
  useGetAllMetersQuery,
  useRecordMeterReadingMutation,
  useRemoveMeterTriggerMutation,
  useUpdateMeterTriggerMutation,
} from "@/redux/Meter/Meterapi";
import { useGetAllEquipmentQuery } from "@/redux/Equipment/Equipmentapi";
import { useGetTechniciansQuery } from "@/redux/Maintenance/Maintenanceapi";
import { MeterListPanel } from "@/component/meters/Meterlistpanel";
import { MeterDetailPanel } from "@/component/meters/Meterdetailpanel";
import { MeterTriggerModal } from "@/component/meters/Metertriggermodal";
import { NewMeterModal } from "@/component/meters/Newmetermodal";
import { RecordReadingModal } from "@/component/meters/Recordreadingmodal";

export default function MetersPage() {
  const { data, isLoading, isError, refetch } = useGetAllMetersQuery();
  const { data: equipmentData } = useGetAllEquipmentQuery();
  const { data: technicians = [] } = useGetTechniciansQuery();

  const [createMeter, { isLoading: creatingMeter }] = useCreateMeterMutation();
  const [recordReading, { isLoading: recordingReading }] = useRecordMeterReadingMutation();
  const [addTrigger, { isLoading: addingTrigger }] = useAddMeterTriggerMutation();
  const [updateTrigger, { isLoading: updatingTrigger }] = useUpdateMeterTriggerMutation();
  const [removeTrigger] = useRemoveMeterTriggerMutation();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newMeterOpen, setNewMeterOpen] = useState(false);
  const [readingModalOpen, setReadingModalOpen] = useState(false);
  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<MeterTrigger | null>(null);
  const [deletingTriggerId, setDeletingTriggerId] = useState<string | null>(null);

  const meters: Meter[] = data?.data ?? [];
  const effectiveId = selectedId ?? meters[0]?.id ?? null;
  const selectedMeter = meters.find((m) => m.id === effectiveId) ?? null;

  const handleSelect = useCallback((m: Meter) => setSelectedId(m.id), []);

  const equipmentOptions = useMemo(
    () =>
      (equipmentData?.data ?? [])
        .filter((e) => e.active !== false)
        .map((e) => ({ id: e.id, name: e.name, assetCode: e.assetCode ?? null })),
    [equipmentData],
  );

  const handleCreateMeter = async (form: Parameters<typeof createMeter>[0]) => {
    const result = await createMeter(form).unwrap();
    refetch();
    setSelectedId(result.data.id);
  };

  const handleRecordReading = async (value: number, note?: string) => {
    if (!selectedMeter) return;
    const result = await recordReading({ id: selectedMeter.id, value, note }).unwrap();
    return { triggeredWorkOrder: result.data.reading.triggeredWorkOrder };
  };

  const handleTriggerSubmit = async (form: Parameters<typeof addTrigger>[0]["data"]) => {
    if (!selectedMeter) return;
    if (editingTrigger) {
      await updateTrigger({ id: selectedMeter.id, triggerId: editingTrigger.id, data: form }).unwrap();
    } else {
      await addTrigger({ id: selectedMeter.id, data: form }).unwrap();
    }
  };

  const handleDeleteTrigger = async (triggerId: string) => {
    if (!selectedMeter) return;
    setDeletingTriggerId(triggerId);
    try {
      await removeTrigger({ id: selectedMeter.id, triggerId }).unwrap();
    } finally {
      setDeletingTriggerId(null);
    }
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #F5F3FF 0%, #EEF2FF 50%, #F0F9FF 100%)",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
            animation: "breathe 1.5s ease-in-out infinite",
          }}
        >
          <i className="ti ti-gauge" style={{ fontSize: 22, color: "#fff" }} aria-hidden="true" />
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#3730A3", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            MaintenancePro
          </p>
          <p style={{ fontSize: 12, color: "#A5B4FC", margin: 0 }}>Loading meters…</p>
        </div>
        <style>{`
          @keyframes breathe {
            0%, 100% { transform: scale(1); box-shadow: 0 8px 24px rgba(99,102,241,0.35); }
            50% { transform: scale(1.06); box-shadow: 0 12px 32px rgba(99,102,241,0.5); }
          }
        `}</style>
      </div>
    );
  }

  // ── Error state ──
  if (isError) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFF5F5",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "#FEE2E2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i className="ti ti-alert-triangle" style={{ fontSize: 24, color: "#DC2626" }} aria-hidden="true" />
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#7F1D1D", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            Something went wrong
          </p>
          <p style={{ fontSize: 12, color: "#EF4444", margin: 0 }}>Failed to load meters</p>
        </div>
        <button
          onClick={refetch}
          style={{
            padding: "9px 20px",
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <i className="ti ti-refresh" style={{ fontSize: 13 }} aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }

  // ── Empty state (no meters yet at all) ──
  const showEmptyState = meters.length === 0;

  // ── Main layout ──
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8FAFF" }}>
      <WorkOrderSidebar />
      <main style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <MeterListPanel
          meters={meters}
          selectedId={effectiveId}
          onSelect={handleSelect}
          onNew={() => setNewMeterOpen(true)}
        />

        {showEmptyState ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              padding: 40,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "#EEF2FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="ti ti-gauge" style={{ fontSize: 26, color: "#6366F1" }} aria-hidden="true" />
            </div>
            <div style={{ textAlign: "center", maxWidth: 320 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>No meters yet</p>
              <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>
                Add a meter to an asset to track readings and trigger work orders automatically.
              </p>
            </div>
            <button
              onClick={() => setNewMeterOpen(true)}
              style={{
                padding: "9px 18px",
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 6px 16px rgba(99,102,241,0.3)",
              }}
            >
              New meter
            </button>
          </div>
        ) : (
          selectedMeter && (
            <MeterDetailPanel
              meter={selectedMeter}
              onRecordReading={() => setReadingModalOpen(true)}
              onAddTrigger={() => {
                setEditingTrigger(null);
                setTriggerModalOpen(true);
              }}
              onEditTrigger={(t) => {
                setEditingTrigger(t);
                setTriggerModalOpen(true);
              }}
              onDeleteTrigger={handleDeleteTrigger}
              deletingTriggerId={deletingTriggerId}
            />
          )
        )}
      </main>

      <NewMeterModal
        open={newMeterOpen}
        onClose={() => setNewMeterOpen(false)}
        onSubmit={handleCreateMeter}
        equipmentOptions={equipmentOptions}
        isSubmitting={creatingMeter}
      />

      <RecordReadingModal
        open={readingModalOpen}
        onClose={() => setReadingModalOpen(false)}
        meter={selectedMeter}
        onSubmit={handleRecordReading}
        isSubmitting={recordingReading}
      />

      <MeterTriggerModal
        open={triggerModalOpen}
        onClose={() => setTriggerModalOpen(false)}
        meterUnit={selectedMeter?.unit ?? ""}
        technicianOptions={technicians}
        editingTrigger={editingTrigger}
        onSubmit={handleTriggerSubmit}
        isSubmitting={addingTrigger || updatingTrigger}
      />
    </div>
  );
}