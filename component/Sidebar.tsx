"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { NAV_ASSET_ITEMS, NAV_CONFIG_ITEMS, NAV_ITEMS } from "@/types/tokens";

interface SidebarProps {
  user?: { name: string; role: string };
}

export function WorkOrderSidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const NavItem = ({
    label,
    icon,
    badge,
    href,
  }: {
    label: string;
    icon: string;
    badge?: number;
    href: string;
  }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 14px",
          fontSize: 13,
          color: active ? "#4F46E5" : "#64748B",
          textDecoration: "none",
          fontWeight: active ? 600 : 400,
          background: active
            ? "linear-gradient(90deg, #EEF2FF 0%, #F5F3FF 100%)"
            : "transparent",
          borderRadius: 10,
          margin: "1px 8px",
          transition: "all 0.15s ease",
          borderLeft: active ? "3px solid #6366F1" : "3px solid transparent",
          letterSpacing: "-0.01em",
        }}
      >
        <i
          className={`ti ${icon}`}
          style={{
            fontSize: 17,
            flexShrink: 0,
            color: active ? "#6366F1" : "#94A3B8",
          }}
          aria-hidden="true"
        />
        <span style={{ flex: 1 }}>{label}</span>
        {badge !== undefined && (
          <span
            style={{
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 99,
              lineHeight: "17px",
              boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
            }}
          >
            {badge}
          </span>
        )}
      </Link>
    );
  };

  const displayName = user?.name ?? "Giselle Georges";
  const displayRole = user?.role ?? "Administrator";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      style={{
        width: 228,
        background: "#FAFBFF",
        borderRight: "1px solid #E8EAFF",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "22px 18px 18px",
          borderBottom: "1px solid #E8EAFF",
          display: "flex",
          alignItems: "center",
          gap: 11,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
          }}
        >
          <Settings size={16} color="#fff" strokeWidth={2} />
        </div>
        <div>
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#0F172A",
              margin: 0,
              letterSpacing: "-0.03em",
            }}
          >
            MaintenancePro
          </p>
          <p
            style={{
              fontSize: 10,
              color: "#A5B4FC",
              margin: 0,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Enterprise
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 12, overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}

        <p
          style={{
            padding: "20px 22px 7px",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#C7D2FE",
            margin: 0,
          }}
        >
          Assets
        </p>
        {NAV_ASSET_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}

        <p
          style={{
            padding: "20px 22px 7px",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#C7D2FE",
            margin: 0,
          }}
        >
          Config
        </p>
        {NAV_CONFIG_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* User footer */}
      <div
        style={{
          padding: "14px 16px",
          borderTop: "1px solid #E8EAFF",
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          background: "#F5F3FF",
          margin: 8,
          borderRadius: 12,
          border: "1px solid #E0E7FF",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#3730A3",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              letterSpacing: "-0.01em",
            }}
          >
            {displayName}
          </p>
          <p style={{ fontSize: 10, color: "#818CF8", margin: 0, fontWeight: 500 }}>
            {displayRole}
          </p>
        </div>
        <i
          className="ti ti-selector"
          style={{ fontSize: 15, color: "#A5B4FC" }}
          aria-hidden="true"
        />
      </div>
    </aside>
  );
}