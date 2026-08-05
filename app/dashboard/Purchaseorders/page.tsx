"use client";

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Plus,
  X,
  Check,
  Ban,
  Truck,
  PackageCheck,
  Pencil,
  Trash2,
  Search,
  ChevronDown,
} from "lucide-react";
import { PurchaseOrderStatus, PurchaseOrderListItem, useGetAllPurchaseOrdersQuery, useDeletePurchaseOrderMutation, useApprovePurchaseOrderMutation, useDeclinePurchaseOrderMutation, useMarkPurchaseOrderAsOrderedMutation, useCancelPurchaseOrderMutation, useCreatePurchaseOrderMutation, useUpdatePurchaseOrderMutation, PurchaseOrderFormInput, EMPTY_PURCHASE_ORDER_FORM, LineItemInput, useFulfillPurchaseOrderItemsMutation, FulfillItemInput } from "@/redux/PurchaseOrder/Purchaseorderapi";



// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<PurchaseOrderStatus, string> = {
  requested: "bg-amber-50 text-amber-700 border-amber-200",
  declined: "bg-rose-50 text-rose-700 border-rose-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  ordered: "bg-indigo-50 text-indigo-700 border-indigo-200",
  partially_fulfilled: "bg-violet-50 text-violet-700 border-violet-200",
  fulfilled: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

const STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  requested: "Requested",
  declined: "Declined",
  approved: "Approved",
  ordered: "Ordered",
  partially_fulfilled: "Partially fulfilled",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

const STATUS_FILTERS: (PurchaseOrderStatus | "all")[] = [
  "all",
  "requested",
  "approved",
  "ordered",
  "partially_fulfilled",
  "fulfilled",
  "declined",
  "cancelled",
];

function currency(n: number | undefined) {
  if (n === undefined) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PurchaseOrdersPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = useSelector((state: any) => state.auth?.user);
  const isAdmin = user?.role === "manager";

  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrderListItem | null>(null);
  const [detailPO, setDetailPO] = useState<PurchaseOrderListItem | null>(null);
  const [fulfillPO, setFulfillPO] = useState<PurchaseOrderListItem | null>(null);
  const [declinePOId, setDeclinePOId] = useState<number | null>(null);

  const { data, isLoading, isFetching } = useGetAllPurchaseOrdersQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: search || undefined,
  });

  const [deletePurchaseOrder] = useDeletePurchaseOrderMutation();
  const [approvePurchaseOrder] = useApprovePurchaseOrderMutation();
  const [declinePurchaseOrder] = useDeclinePurchaseOrderMutation();
  const [markAsOrdered] = useMarkPurchaseOrderAsOrderedMutation();
  const [cancelPurchaseOrder] = useCancelPurchaseOrderMutation();

  const orders = data?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Purchase Orders</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? "Request, approve, and fulfill orders from your vendors."
              : "Request parts and track the status of your orders."}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          {isAdmin ? "New purchase order" : "Request purchase order"}
        </button>
      </header>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PO number or vendor…"
            className="w-64 rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                statusFilter === s
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {s === "all" ? "All" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">PO #</th>
              <th className="px-4 py-3 font-medium">Vendor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Items</th>
              {isAdmin && <th className="px-4 py-3 font-medium">Total</th>}
              <th className="px-4 py-3 font-medium">Requested by</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  Loading purchase orders…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  No purchase orders yet. Create one to get started.
                </td>
              </tr>
            ) : (
              orders.map((po) => (
                <tr
                  key={po.id}
                  onClick={() => setDetailPO(po)}
                  className="cursor-pointer transition hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">{po.poNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{po.vendor ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[po.status]}`}
                    >
                      {STATUS_LABELS[po.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{po.items.length}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-slate-600">{currency(po.totalCost)}</td>
                  )}
                  <td className="px-4 py-3 text-slate-600">{po.createdByName}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      po={po}
                      isAdmin={isAdmin}
                      onEdit={() => setEditingPO(po)}
                      onDelete={() => deletePurchaseOrder(po.id)}
                      onApprove={() => approvePurchaseOrder(po.id)}
                      onDecline={() => setDeclinePOId(po.id)}
                      onMarkOrdered={() => markAsOrdered(po.id)}
                      onCancel={() => cancelPurchaseOrder(po.id)}
                      onFulfill={() => setFulfillPO(po)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {isFetching && !isLoading && (
          <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
            Refreshing…
          </div>
        )}
      </div>

      {(isCreateOpen || editingPO) && (
        <PurchaseOrderFormModal
          existing={editingPO}
          onClose={() => {
            setCreateOpen(false);
            setEditingPO(null);
          }}
        />
      )}

      {detailPO && <PurchaseOrderDetailModal po={detailPO} isAdmin={isAdmin} onClose={() => setDetailPO(null)} />}

      {fulfillPO && (
        <FulfillItemsModal po={fulfillPO} onClose={() => setFulfillPO(null)} />
      )}

      {declinePOId !== null && (
        <DeclineModal
          onClose={() => setDeclinePOId(null)}
          onConfirm={(reason) => {
            declinePurchaseOrder({ id: declinePOId, reason });
            setDeclinePOId(null);
          }}
        />
      )}
    </div>
  );
}

// ── Row actions ─────────────────────────────────────────────────────────────

function RowActions({
  po,
  isAdmin,
  onEdit,
  onDelete,
  onApprove,
  onDecline,
  onMarkOrdered,
  onCancel,
  onFulfill,
}: {
  po: PurchaseOrderListItem;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onApprove: () => void;
  onDecline: () => void;
  onMarkOrdered: () => void;
  onCancel: () => void;
  onFulfill: () => void;
}) {
  const [open, setOpen] = useState(false);
  const canCancel = !po.items.some((i) => i.quantityFulfilled > 0);

  if (!isAdmin) return null;

  return (
    <div className="relative flex justify-end">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {po.status === "requested" && (
              <>
                <MenuItem icon={Check} label="Approve" onClick={() => { onApprove(); setOpen(false); }} />
                <MenuItem icon={Ban} label="Decline" onClick={() => { onDecline(); setOpen(false); }} />
              </>
            )}
            {po.status === "approved" && (
              <>
                <MenuItem icon={Truck} label="Mark as ordered" onClick={() => { onMarkOrdered(); setOpen(false); }} />
                <MenuItem icon={Pencil} label="Edit" onClick={() => { onEdit(); setOpen(false); }} />
              </>
            )}
            {(po.status === "ordered" || po.status === "partially_fulfilled") && (
              <MenuItem icon={PackageCheck} label="Fulfill items" onClick={() => { onFulfill(); setOpen(false); }} />
            )}
            {po.status === "requested" && (
              <MenuItem icon={Pencil} label="Edit" onClick={() => { onEdit(); setOpen(false); }} />
            )}
            {canCancel && !["cancelled", "declined", "fulfilled"].includes(po.status) && (
              <MenuItem icon={Ban} label="Cancel" onClick={() => { onCancel(); setOpen(false); }} />
            )}
            <MenuItem
              icon={Trash2}
              label="Delete"
              danger
              onClick={() => { onDelete(); setOpen(false); }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Check;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
        danger ? "text-rose-600" : "text-slate-700"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

// ── Create / edit modal ───────────────────────────────────────────────────────

function PurchaseOrderFormModal({
  existing,
  onClose,
}: {
  existing: PurchaseOrderListItem | null;
  onClose: () => void;
}) {
  const [createPurchaseOrder, { isLoading: isCreating }] = useCreatePurchaseOrderMutation();
  const [updatePurchaseOrder, { isLoading: isUpdating }] = useUpdatePurchaseOrderMutation();

  const [form, setForm] = useState<PurchaseOrderFormInput>(() =>
    existing
      ? {
          vendor: existing.vendor,
          vendorContact: existing.vendorContact,
          items: existing.items.map((i) => ({
            partId: i.partId ?? undefined,
            partName: i.partName,
            quantityOrdered: i.quantityOrdered,
            unitCost: i.unitCost,
          })),
          taxAmount: existing.taxAmount ?? 0,
          additionalCosts: existing.additionalCosts ?? [],
          expectedDeliveryDate: existing.expectedDeliveryDate,
          notes: existing.notes,
        }
      : EMPTY_PURCHASE_ORDER_FORM,
  );

  const isSaving = isCreating || isUpdating;

  function updateItem(index: number, patch: Partial<LineItemInput>) {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));
  }

  function addItem() {
    setForm((f) => ({
      ...f,
      items: [...f.items, { partId: undefined, partName: "", quantityOrdered: 1, unitCost: 0 }],
    }));
  }

  function removeItem(index: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (existing) {
      await updatePurchaseOrder({ id: existing.id, data: form });
    } else {
      await createPurchaseOrder(form);
    }
    onClose();
  }

  return (
    <Modal title={existing ? "Edit purchase order" : "New purchase order"} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Vendor (optional)">
            <input
              value={form.vendor ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value || null }))}
              className="input"
              placeholder="Acme Supply Co."
            />
          </Field>
          <Field label="Vendor contact">
            <input
              value={form.vendorContact ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, vendorContact: e.target.value || null }))}
              className="input"
              placeholder="contact@acme.com"
            />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Line items</label>
            <button type="button" onClick={addItem} className="text-xs font-medium text-slate-500 hover:text-slate-900">
              + Add item
            </button>
          </div>
          <div className="space-y-2">
            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_90px_100px_28px] items-center gap-2">
                <input
                  value={item.partName ?? ""}
                  onChange={(e) => updateItem(i, { partName: e.target.value })}
                  placeholder="Part name (or one-off item)"
                  className="input"
                />
                <input
                  type="number"
                  min={1}
                  value={item.quantityOrdered}
                  onChange={(e) => updateItem(i, { quantityOrdered: Number(e.target.value) })}
                  className="input"
                  placeholder="Qty"
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.unitCost ?? 0}
                  onChange={(e) => updateItem(i, { unitCost: Number(e.target.value) })}
                  className="input"
                  placeholder="Unit cost"
                />
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Tax amount">
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.taxAmount}
              onChange={(e) => setForm((f) => ({ ...f, taxAmount: Number(e.target.value) }))}
              className="input"
            />
          </Field>
          <Field label="Expected delivery">
            <input
              type="date"
              value={form.expectedDeliveryDate ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, expectedDeliveryDate: e.target.value || null }))}
              className="input"
            />
          </Field>
        </div>

        <Field label="Notes">
          <textarea
            value={form.notes ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
            className="input min-h-[70px] resize-none"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isSaving} className="btn-primary">
            {isSaving ? "Saving…" : existing ? "Save changes" : "Submit"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Detail modal ──────────────────────────────────────────────────────────────

function PurchaseOrderDetailModal({
  po,
  isAdmin,
  onClose,
}: {
  po: PurchaseOrderListItem;
  isAdmin: boolean;
  onClose: () => void;
}) {
  return (
    <Modal title={po.poNumber} onClose={onClose} wide>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[po.status]}`}>
            {STATUS_LABELS[po.status]}
          </span>
          <span className="text-sm text-slate-500">Requested by {po.createdByName}</span>
        </div>

        {po.declineReason && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Declined: {po.declineReason}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Vendor</p>
            <p className="text-slate-800">{po.vendor ?? "—"}</p>
          </div>
          <div>
            <p className="text-slate-400">Expected delivery</p>
            <p className="text-slate-800">{po.expectedDeliveryDate ?? "—"}</p>
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-400">
            <tr>
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 font-medium">Ordered</th>
              <th className="py-2 font-medium">Fulfilled</th>
              {isAdmin && <th className="py-2 font-medium">Unit cost</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {po.items.map((item, i) => (
              <tr key={i}>
                <td className="py-2">
                  {item.partName}
                  {item.isOneOff && <span className="ml-1.5 text-xs text-slate-400">(one-off)</span>}
                </td>
                <td className="py-2">{item.quantityOrdered}</td>
                <td className="py-2">{item.quantityFulfilled}</td>
                {isAdmin && <td className="py-2">{currency(item.unitCost)}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {isAdmin && (
          <div className="ml-auto w-56 space-y-1 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{currency(po.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax</span>
              <span>{currency(po.taxAmount)}</span>
            </div>
            {po.additionalCosts?.map((c, i) => (
              <div key={i} className="flex justify-between text-slate-500">
                <span>{c.description}</span>
                <span>{currency(c.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-slate-200 pt-1 font-medium text-slate-900">
              <span>Total</span>
              <span>{currency(po.totalCost)}</span>
            </div>
          </div>
        )}

        {po.notes && <p className="text-sm text-slate-600">{po.notes}</p>}
      </div>
    </Modal>
  );
}

// ── Fulfill items modal ───────────────────────────────────────────────────────

function FulfillItemsModal({ po, onClose }: { po: PurchaseOrderListItem; onClose: () => void }) {
  const [fulfillItems, { isLoading }] = useFulfillPurchaseOrderItemsMutation();

  const remaining = po.items.filter((i) => i.quantityFulfilled < i.quantityOrdered);
  const [quantities, setQuantities] = useState<Record<number, number>>(
    Object.fromEntries(remaining.map((_, i) => [i, 0])),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const items: FulfillItemInput[] = remaining
      .map((item, i) => ({
        partId: item.partId,
        partName: item.partName,
        quantityFulfilled: quantities[i] ?? 0,
      }))
      .filter((i) => i.quantityFulfilled > 0);

    if (items.length === 0) return onClose();
    await fulfillItems({ id: po.id, items });
    onClose();
  }

  return (
    <Modal title={`Fulfill items — ${po.poNumber}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {remaining.length === 0 ? (
          <p className="text-sm text-slate-500">All items on this order have already been fulfilled.</p>
        ) : (
          remaining.map((item, i) => {
            const stillDue = item.quantityOrdered - item.quantityFulfilled;
            return (
              <div key={i} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.partName}</p>
                  <p className="text-xs text-slate-400">{stillDue} remaining of {item.quantityOrdered}</p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={stillDue}
                  value={quantities[i] ?? 0}
                  onChange={(e) =>
                    setQuantities((q) => ({ ...q, [i]: Math.min(Number(e.target.value), stillDue) }))
                  }
                  className="input w-24"
                />
              </div>
            );
          })
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? "Saving…" : "Confirm fulfillment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Decline modal ─────────────────────────────────────────────────────────────

function DeclineModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <Modal title="Decline request" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Reason (optional)">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input min-h-[80px] resize-none"
            placeholder="Let the requester know why…"
          />
        </Field>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={() => onConfirm(reason)} className="btn-primary bg-rose-600 hover:bg-rose-700">
            Decline
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Shared bits ────────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className={`max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white p-6 shadow-xl ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}