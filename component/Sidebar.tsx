"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { NAV_ASSET_ITEMS, NAV_CONFIG_ITEMS, NAV_ITEMS } from "@/types/tokens";
;

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
          gap: "9px",
          padding: "7px 14px",
          fontSize: "13px",
          color: active ? "#1B2A4A" : "#6B7280",
          textDecoration: "none",
          borderRadius: "0",
          position: "relative",
          fontWeight: active ? 500 : 400,
          background: active ? "#F0F5FF" : "transparent",
          transition: "background 0.1s, color 0.1s",
        }}
      >
        {active && (
          <span
            style={{
              position: "absolute",
              left: 0,
              top: 5,
              bottom: 5,
              width: 3,
              borderRadius: "0 3px 3px 0",
              background: "#2563EB",
            }}
          />
        )}
        <i className={`ti ${icon}`} style={{ fontSize: 15 }} aria-hidden="true" />
        <span style={{ flex: 1 }}>{label}</span>
        {badge !== undefined && (
          <span
            style={{
              background: "#2563EB",
              color: "#fff",
              fontSize: 10,
              fontWeight: 600,
              padding: "1px 6px",
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

  return (
    <aside
      style={{
        width: 220,
        background: "#fff",
        borderRight: "1px solid #E5E7EB",
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
          padding: "18px 14px",
          borderBottom: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "#1B2A4A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Settings size={16} color="#93B4FF" />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.01em" }}>
            MaintenancePro
          </p>
          <p style={{ fontSize: 10, color: "#9CA3AF", margin: 0, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Enterprise
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 8, overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}

        <p
          style={{
            padding: "14px 14px 4px",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#9CA3AF",
          }}
        >
          Assets
        </p>
        {NAV_ASSET_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}

        <p
          style={{
            padding: "14px 14px 4px",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#9CA3AF",
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
          padding: "12px 14px",
          borderTop: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          gap: 9,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "#1B2A4A",
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {user?.name
            ?.split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2) ?? "GG"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.name ?? "Giselle Georges"}
          </p>
          <p style={{ fontSize: 10, color: "#9CA3AF", margin: 0 }}>
            {user?.role ?? "Administrator"}
          </p>
        </div>
        <i className="ti ti-chevron-right" style={{ fontSize: 13, color: "#D1D5DB" }} aria-hidden="true" />
      </div>
    </aside>
  );
}