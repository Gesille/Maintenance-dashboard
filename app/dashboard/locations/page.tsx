// app/dashboard/locations/page.tsx
"use client";

import { useState } from "react";
import { Plus, Search, Edit3, Trash2, Save, X, Loader, MapPin, UtensilsCrossed } from "lucide-react";
import { WorkOrderSidebar } from "@/component/Sidebar";
import { Toaster } from "@/component/Toaster";
import { useToast } from "@/types/useToast";
import {
  useGetAllLocationsQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
} from "@/redux/Location/Locationapi";
import {
  useGetAllRestaurantsQuery,
  useCreateRestaurantMutation,
  useUpdateRestaurantMutation,
  useDeleteRestaurantMutation,
} from "@/redux/Restaurant/Restaurantapi";

type Tab = "locations" | "restaurants";
type Item = { id: number; name: string };

export default function LocationsAndRestaurantsPage() {
  const [tab, setTab] = useState<Tab>("locations");
  const { toasts, addToast, removeToast } = useToast();

  const locationsQuery = useGetAllLocationsQuery();
  const [createLocation] = useCreateLocationMutation();
  const [updateLocation] = useUpdateLocationMutation();
  const [deleteLocation] = useDeleteLocationMutation();

  const restaurantsQuery = useGetAllRestaurantsQuery();
  const [createRestaurant] = useCreateRestaurantMutation();
  const [updateRestaurant] = useUpdateRestaurantMutation();
  const [deleteRestaurant] = useDeleteRestaurantMutation();

  const active =
    tab === "locations"
      ? {
          items: (locationsQuery.data?.data ?? []) as Item[],
          isLoading: locationsQuery.isLoading,
          create: (name: string) => createLocation({ name }).unwrap(),
          update: (id: number, name: string) => updateLocation({ id, name }).unwrap(),
          remove: (id: number) => deleteLocation(id).unwrap(),
          singular: "location",
          icon: <MapPin size={13} />,
        }
      : {
          items: (restaurantsQuery.data?.data ?? []) as Item[],
          isLoading: restaurantsQuery.isLoading,
          create: (name: string) => createRestaurant({ name }).unwrap(),
          update: (id: number, name: string) => updateRestaurant({ id, name }).unwrap(),
          remove: (id: number) => deleteRestaurant(id).unwrap(),
          singular: "restaurant",
          icon: <UtensilsCrossed size={13} />,
        };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#F8FAFF" }}>
      <WorkOrderSidebar />
      <main style={{ flex: 1, overflowY: "auto", padding: "28px 36px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: "0 0 4px", letterSpacing: "-0.03em" }}>
          Locations & Restaurants
        </h1>
        <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 20px" }}>
          Two independent lists used on the Equipment form — manage both here.
        </p>

        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 20,
            background: "#EEF2FF",
            padding: 4,
            borderRadius: 10,
            width: "fit-content",
          }}
        >
          {(["locations", "restaurants"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? "#3730A3" : "#64748B",
                boxShadow: tab === t ? "0 1px 4px rgba(99,102,241,0.15)" : "none",
              }}
            >
              {t === "locations" ? <MapPin size={13} /> : <UtensilsCrossed size={13} />}
              {t}
            </button>
          ))}
        </div>

        <ManagedList
          key={tab}
          items={active.items}
          isLoading={active.isLoading}
          singular={active.singular}
          onCreate={async (name) => {
            try {
              await active.create(name);
              addToast(`${active.singular} created`, "success");
            } catch {
              addToast("Something went wrong. Please try again.", "error");
            }
          }}
          onUpdate={async (id, name) => {
            try {
              await active.update(id, name);
              addToast(`${active.singular} updated`, "success");
            } catch {
              addToast("Something went wrong. Please try again.", "error");
            }
          }}
          onDelete={async (id) => {
            try {
              await active.remove(id);
              addToast(`${active.singular} deleted`, "success");
            } catch {
              addToast(`Failed to delete ${active.singular}`, "error");
            }
          }}
        />
      </main>
      <Toaster toasts={toasts} onRemove={removeToast} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ManagedList({
  items,
  isLoading,
  singular,
  onCreate,
  onUpdate,
  onDelete,
}: {
  items: Item[];
  isLoading: boolean;
  singular: string;
  onCreate: (name: string) => Promise<void>;
  onUpdate: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null); // 0 = creating
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = items.filter((i) => search === "" || i.name.toLowerCase().includes(search.toLowerCase()));

  const startCreate = () => {
    setEditingId(0);
    setName("");
  };
  const startEdit = (i: Item) => {
    setEditingId(i.id);
    setName(i.name);
  };
  const cancel = () => {
    setEditingId(null);
    setName("");
  };

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    if (editingId === 0) await onCreate(name.trim());
    else if (editingId) await onUpdate(editingId, name.trim());
    setSaving(false);
    cancel();
  };

  const remove = async (id: number) => {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
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
            maxWidth: 300,
          }}
        >
          <Search size={13} color="#A5B4FC" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${singular}s…`}
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 12, width: "100%" }}
          />
        </div>
        <button
          onClick={startCreate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 16px",
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
          }}
        >
          <Plus size={14} strokeWidth={2.5} /> New {singular}
        </button>
      </div>

      {editingId !== null && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #E8EAFF",
            borderRadius: 14,
            padding: "16px 20px",
            marginBottom: 16,
            display: "flex",
            gap: 12,
            alignItems: "flex-end",
          }}
        >
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 5 }}>
              {singular.charAt(0).toUpperCase() + singular.slice(1)} name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              style={{
                width: "100%",
                boxSizing: "border-box",
                fontSize: 13,
                padding: "9px 11px",
                borderRadius: 9,
                border: "1.5px solid #E8EAFF",
                background: "#FAFBFF",
                outline: "none",
              }}
              placeholder={singular === "location" ? "e.g. Main Bar" : "e.g. Larder"}
            />
          </div>
          <button
            onClick={save}
            disabled={saving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 14px",
              fontSize: 12,
              fontWeight: 600,
              color: "#fff",
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              border: "none",
              borderRadius: 9,
              cursor: "pointer",
            }}
          >
            {saving ? <Loader size={13} style={{ animation: "spin 0.7s linear infinite" }} /> : <Save size={13} />} Save
          </button>
          <button
            onClick={cancel}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 14px",
              fontSize: 12,
              fontWeight: 600,
              color: "#64748B",
              background: "#fff",
              border: "1.5px solid #E8EAFF",
              borderRadius: 9,
              cursor: "pointer",
            }}
          >
            <X size={13} /> Cancel
          </button>
        </div>
      )}

      <div
        style={{
          background: "#fff",
          border: "1px solid #E8EAFF",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(99,102,241,0.06)",
        }}
      >
        {isLoading && <div style={{ padding: 24, fontSize: 13, color: "#94A3B8" }}>Loading…</div>}
        {!isLoading && filtered.length === 0 && (
          <div style={{ padding: 24, fontSize: 13, color: "#94A3B8" }}>No {singular}s yet.</div>
        )}
        {filtered.map((i) => (
          <div
            key={i.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "13px 18px",
              borderBottom: "1px solid #F0F4FF",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{i.name}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => startEdit(i)}
                style={{
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  border: "1.5px solid #E8EAFF",
                  background: "#fff",
                  color: "#64748B",
                  cursor: "pointer",
                }}
              >
                <Edit3 size={13} />
              </button>
              <button
                onClick={() => remove(i.id)}
                style={{
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  border: "1.5px solid #FECACA",
                  background: "#fff",
                  color: "#DC2626",
                  cursor: "pointer",
                }}
              >
                {deletingId === i.id ? <Loader size={13} style={{ animation: "spin 0.7s linear infinite" }} /> : <Trash2 size={13} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}