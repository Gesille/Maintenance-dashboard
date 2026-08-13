"use client";

import { useCallback, useMemo, useState } from "react";
import { WorkOrderSidebar } from "@/component/Sidebar";

import {
  Procedure,
  ProcedureField,
  ProcedureFieldInput,
  ProcedureStatus,
  useAddProcedureFieldMutation,
  useBulkAttachProcedureMutation,
  useCreateProcedureMutation,
  useDeleteProcedureMutation,
  useDuplicateProcedureMutation,
  useGetAllProceduresQuery,
  usePublishProcedureMutation,
  useRemoveProcedureFieldMutation,
  useReorderProcedureFieldsMutation,
  useUpdateProcedureFieldMutation,
  useUpdateProcedureMutation,
} from "@/redux/procedure/Procedureapi";
import { ProcedureListPanel } from "@/component/procedure/Procedurelistpanel";
import { ProcedureDetailPanel } from "@/component/procedure/Proceduredetailpanel";
import { NewProcedureModal } from "@/component/procedure/Newproceduremodal";
import { AttachProcedureModal } from "@/component/procedure/Attachproceduremodal";
import { FieldEditorModal } from "@/component/procedure/Fieldeditormodal";



export default function ProcedureLibraryPage() {
  // ── Filters ──
  const [status, setStatus] = useState<ProcedureStatus | "all">("all");
  const [search, setSearch] = useState("");

  const { data: procedures = [], isLoading, isError, isFetching, refetch } = useGetAllProceduresQuery({
    status: status === "all" ? undefined : status,
    search: search || undefined,
  });

  // ── Selection ──
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const effectiveId = selectedId ?? procedures[0]?.id ?? null;
  const selectedProcedure: Procedure | null = useMemo(
    () => procedures.find((p) => p.id === effectiveId) ?? null,
    [procedures, effectiveId],
  );
  const handleSelect = useCallback((p: Procedure) => setSelectedId(p.id), []);

  // ── Modals ──
  const [newProcedureOpen, setNewProcedureOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [fieldEditorOpen, setFieldEditorOpen] = useState(false);
  const [editingField, setEditingField] = useState<ProcedureField | null>(null);
  const [removingFieldId, setRemovingFieldId] = useState<string | null>(null);
  const [reorderingFieldId, setReorderingFieldId] = useState<string | null>(null);

  // ── Mutations ──
  const [createProcedure, { isLoading: creating }] = useCreateProcedureMutation();
  const [updateProcedure, { isLoading: savingDetails }] = useUpdateProcedureMutation();
  const [deleteProcedure, { isLoading: deleting }] = useDeleteProcedureMutation();
  const [publishProcedure, { isLoading: publishing }] = usePublishProcedureMutation();
  const [duplicateProcedure, { isLoading: duplicating }] = useDuplicateProcedureMutation();
  const [addField] = useAddProcedureFieldMutation();
  const [updateField] = useUpdateProcedureFieldMutation();
  const [removeField] = useRemoveProcedureFieldMutation();
  const [reorderFields] = useReorderProcedureFieldsMutation();
  const [bulkAttach, { isLoading: attaching }] = useBulkAttachProcedureMutation();

  // ── Library-level handlers ──
  const handleNew = useCallback(() => setNewProcedureOpen(true), []);

  const handleCreateProcedure = useCallback(
    async (input: Parameters<typeof createProcedure>[0]) => {
      const created = await createProcedure(input).unwrap();
      setNewProcedureOpen(false);
      setSelectedId(created.id);
    },
    [createProcedure],
  );

  const handleSaveDetails = useCallback(
    async (input: Parameters<typeof updateProcedure>[0] extends { id: number } ? Omit<Parameters<typeof updateProcedure>[0], "id"> : never) => {
      if (!selectedProcedure) return;
      await updateProcedure({ id: selectedProcedure.id, ...input }).unwrap();
    },
    [selectedProcedure, updateProcedure],
  );

  const handlePublish = useCallback(async () => {
    if (!selectedProcedure) return;
    await publishProcedure(selectedProcedure.id).unwrap();
  }, [selectedProcedure, publishProcedure]);

  const handleDuplicate = useCallback(async () => {
    if (!selectedProcedure) return;
    const copy = await duplicateProcedure(selectedProcedure.id).unwrap();
    setSelectedId(copy.id);
  }, [selectedProcedure, duplicateProcedure]);

  const handleDelete = useCallback(async () => {
    if (!selectedProcedure) return;
    await deleteProcedure(selectedProcedure.id).unwrap();
    setSelectedId(null);
  }, [selectedProcedure, deleteProcedure]);

  // ── Field handlers ──
  const handleAddField = useCallback(() => {
    setEditingField(null);
    setFieldEditorOpen(true);
  }, []);

  const handleEditField = useCallback((field: ProcedureField) => {
    setEditingField(field);
    setFieldEditorOpen(true);
  }, []);

  const handleFieldSubmit = useCallback(
    async (input: ProcedureFieldInput) => {
      if (!selectedProcedure) return;
      if (editingField) {
        await updateField({ id: selectedProcedure.id, fieldId: editingField.id, data: input }).unwrap();
      } else {
        await addField({ id: selectedProcedure.id, field: input }).unwrap();
      }
      setFieldEditorOpen(false);
      setEditingField(null);
    },
    [selectedProcedure, editingField, addField, updateField],
  );

  const handleRemoveField = useCallback(
    async (fieldId: string) => {
      if (!selectedProcedure) return;
      setRemovingFieldId(fieldId);
      try {
        await removeField({ id: selectedProcedure.id, fieldId }).unwrap();
      } finally {
        setRemovingFieldId(null);
      }
    },
    [selectedProcedure, removeField],
  );

  const handleMoveField = useCallback(
    async (fieldId: string, direction: "up" | "down") => {
      if (!selectedProcedure) return;
      const sorted = [...selectedProcedure.fields].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((f) => f.id === fieldId);
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (index === -1 || swapIndex < 0 || swapIndex >= sorted.length) return;

      const reordered = [...sorted];
      [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];

      setReorderingFieldId(fieldId);
      try {
        await reorderFields({
          id: selectedProcedure.id,
          orderedFieldIds: reordered.map((f) => f.id),
        }).unwrap();
      } finally {
        setReorderingFieldId(null);
      }
    },
    [selectedProcedure, reorderFields],
  );

  // ── Attach handlers ──
  const handleAttach = useCallback(() => setAttachOpen(true), []);

  const handleBulkAttach = useCallback(
    async (requestIds: number[]) => {
      if (!selectedProcedure) return;
      await bulkAttach({ procedureId: selectedProcedure.id, requestIds }).unwrap();
      setAttachOpen(false);
    },
    [selectedProcedure, bulkAttach],
  );

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
          <i className="ti ti-book" style={{ fontSize: 22, color: "#fff" }} aria-hidden="true" />
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#3730A3", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            MaintenancePro
          </p>
          <p style={{ fontSize: 12, color: "#A5B4FC", margin: 0 }}>Loading procedure library…</p>
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
          <p style={{ fontSize: 12, color: "#EF4444", margin: 0 }}>Failed to load the procedure library</p>
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

  // ── Main layout ──
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8FAFF" }}>
      <WorkOrderSidebar />
      <main style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <ProcedureListPanel
          procedures={procedures}
          total={procedures.length}
          isFetching={isFetching}
          selectedId={effectiveId}
          onSelect={handleSelect}
          onNew={handleNew}
          status={status}
          onStatusChange={setStatus}
          search={search}
          onSearchChange={setSearch}
        />

        {selectedProcedure ? (
          <ProcedureDetailPanel
            procedure={selectedProcedure}
            onSaveDetails={handleSaveDetails}
            isSavingDetails={savingDetails}
            onPublish={handlePublish}
            isPublishing={publishing}
            onDuplicate={handleDuplicate}
            isDuplicating={duplicating}
            onDelete={handleDelete}
            isDeleting={deleting}
            onAttach={handleAttach}
            onAddField={handleAddField}
            onEditField={handleEditField}
            onRemoveField={handleRemoveField}
            removingFieldId={removingFieldId}
            onMoveField={handleMoveField}
            reorderingFieldId={reorderingFieldId}
          />
        ) : (
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
              <i className="ti ti-book" style={{ fontSize: 26, color: "#6366F1" }} aria-hidden="true" />
            </div>
            <div style={{ textAlign: "center", maxWidth: 320 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
                No procedures yet
              </p>
              <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>
                Build a reusable checklist or inspection template to attach to work orders.
              </p>
            </div>
            <button
              onClick={handleNew}
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
              New procedure
            </button>
          </div>
        )}
      </main>

      <NewProcedureModal
        open={newProcedureOpen}
        onClose={() => setNewProcedureOpen(false)}
        onSubmit={handleCreateProcedure}
        isSubmitting={creating}
      />

      {selectedProcedure && (
        <>
          <AttachProcedureModal
            open={attachOpen}
            onClose={() => setAttachOpen(false)}
            procedureTitle={selectedProcedure.title}
            onAttach={handleBulkAttach}
            isSubmitting={attaching}
          />

          <FieldEditorModal
            open={fieldEditorOpen}
            onClose={() => {
              setFieldEditorOpen(false);
              setEditingField(null);
            }}
            onSubmit={handleFieldSubmit}
            editingField={editingField}
            otherFields={selectedProcedure.fields.filter((f) => f.id !== editingField?.id)}
            scoringEnabledOnProcedure={selectedProcedure.scoringEnabled}
            isSubmitting={false}
          />
        </>
      )}
    </div>
  );
}