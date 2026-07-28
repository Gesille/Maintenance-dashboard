"use client";

import { useCallback, useState } from "react";
import { WorkOrderSidebar } from "@/component/Sidebar";
import { EquipmentListPanel } from "@/component/EquipmentListPanel";
import { EquipmentDetailPanel } from "@/component/EquipmentDetailPanel";
import { Toaster } from "@/component/Toaster";
import { useToast } from "@/types/useToast";
import { Equipment, EquipmentFormInput } from "@/types/equipment";
import {
  useGetAllEquipmentQuery,
  useCreateEquipmentMutation,
  useUpdateEquipmentMutation,
  useDeleteEquipmentMutation,
} from "@/redux/Equipment/Equipmentapi";

type Mode = "view" | "edit" | "create";

export default function EquipmentPage() {
  const { data, isLoading, isError, refetch } = useGetAllEquipmentQuery();
  const [createEquipment] = useCreateEquipmentMutation();
  const [updateEquipment] = useUpdateEquipmentMutation();
  const [deleteEquipment] = useDeleteEquipmentMutation();
  const { toasts, addToast, removeToast } = useToast();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const list: Equipment[] = data?.data ?? [];
  const selected = list.find((e) => e.id === selectedId) ?? null;

  const handleSelect = useCallback((eq: Equipment) => {
    setSelectedId(eq.id);
    setMode("view");
  }, []);

  const handleNew = useCallback(() => {
    setSelectedId(null);
    setMode("create");
  }, []);

  const handleEdit = useCallback(() => setMode("edit"), []);
  const handleCancelEdit = useCallback(() => setMode("view"), []);

  const handleSave = async (form: EquipmentFormInput) => {
    setSaving(true);
    try {
      if (mode === "create") {
        const res = await createEquipment(form).unwrap();
        setSelectedId(res.data.id);
        addToast("Equipment created successfully", "success");
      } else if (mode === "edit" && selected) {
        await updateEquipment({ id: selected.id, data: form }).unwrap();
        addToast("Equipment updated successfully", "success");
      }
      setMode("view");
    } catch (err) {
      console.error(err);
      addToast("Something went wrong. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await deleteEquipment(selected.id).unwrap();
      addToast("Equipment deleted", "success");
      setSelectedId(null);
      setMode("view");
    } catch (err) {
      console.error(err);
      addToast("Failed to delete equipment", "error");
    } finally {
      setDeleting(false);
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
      <main style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <EquipmentListPanel
          equipment={list}
          selectedId={selectedId}
          onSelect={handleSelect}
          onNew={handleNew}
        />
        <EquipmentDetailPanel
          equipment={selected}
          mode={mode}
          saving={saving}
          deleting={deleting}
          onEdit={handleEdit}
          onCancelEdit={handleCancelEdit}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </main>
      <Toaster toasts={toasts} onRemove={removeToast} />
    </div>
  );
}