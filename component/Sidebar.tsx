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
          padding: "8px 16px",
          fontSize: 13,
          color: active ? "#fff" : "rgba(255,255,255,0.5)",
          textDecoration: "none",
          position: "relative",
          fontWeight: active ? 500 : 400,
          background: active ? "rgba(255,255,255,0.1)" : "transparent",
          borderRadius: 8,
          margin: "1px 8px",
          transition: "all 0.12s",
        }}
      >
        <i className={`ti ${icon}`} style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true" />
        <span style={{ flex: 1 }}>{label}</span>
        {badge !== undefined && (
          <span
            style={{
              background: "#3B82F6",
              color: "#fff",
              fontSize: 10,
              fontWeight: 600,
              padding: "1px 7px",
              borderRadius: 99,
              lineHeight: "16px",
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
        width: 220,
        background: "#0F172A",
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
          padding: "20px 16px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Settings size={15} color="#fff" />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC", margin: 0, letterSpacing: "-0.02em" }}>
            MaintenancePro
          </p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Enterprise
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 10, overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}

        <p
          style={{
            padding: "18px 24px 6px",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)",
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
            padding: "18px 24px 6px",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)",
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
          padding: "12px 16px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: "#F8FAFC", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>
            {displayRole}
          </p>
        </div>
        <i className="ti ti-selector" style={{ fontSize: 14, color: "rgba(255,255,255,0.25)" }} aria-hidden="true" />
      </div>
    </aside>
  );
}