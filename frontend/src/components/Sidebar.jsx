// src/components/Sidebar.jsx
import React, { useMemo, useState, useCallback } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* Íconos (lucide opcional) */
let Lucide = {};
try { Lucide = require("lucide-react"); } catch (_) {}
const { Home, Bed, Users, Utensils, Boxes, ShieldCheck, Settings } = Lucide;

const FallbackIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M3 9h18M9 21V9" />
  </svg>
);

const Icon = ({ name, size = 18 }) => {
  const map = { Home, Bed, Users, Utensils, Boxes, ShieldCheck, Settings };
  const Comp = map[name];
  return Comp ? <Comp size={size} /> : <FallbackIcon size={size} />;
};

/* Menú base (roles como STRING) */
const MENU = [
  {
    title: "Inicio",
    items: [
      {
        to: "/",
        icon: "Home",
        label: "Home",
        roles: ["ADMIN", "COORD", "TSOCIAL", "INV", "COMPRAS", "PROD", "STAFF"],
      },
    ],
  },
  {
    title: "Operación",
    items: [
      { to: "/beneficiarios", icon: "Users", label: "Beneficiarios", roles: ["ADMIN", "COORD", "TSOCIAL"] },
      { to: "/habitaciones", icon: "Bed", label: "Habitaciones", roles: ["ADMIN", "COORD", "TSOCIAL"] },
    ],
  },
  {
    title: "Almacenes",
    items: [
      { to: "/inventario/cocina", icon: "Utensils", label: "Cocina", roles: ["ADMIN", "STAFF", "INV"] },
      { to: "/bodega", icon: "Boxes", label: "Bodega", roles: ["ADMIN", "STAFF"] },
    ],
  },
  {
    title: "Administración",
    items: [{ to: "/admin/usuarios", icon: "ShieldCheck", label: "Usuarios", roles: ["ADMIN"] }],
  },
];

export default function Sidebar() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  /* 🎨 Paleta OSCURA propia del sidebar */
  const SB = {
    primary: "#3b82f6",
    accent: "#ef4444",

    bg: "linear-gradient(180deg, #141820 0%, #171d29 55%, #1a2234 100%)",
    overlay1: "radial-gradient(900px 320px at 20% -10%, rgba(59,130,246,.25), transparent 70%)",
    overlay2: "radial-gradient(900px 220px at 85% 0%, rgba(239,68,68,.08), transparent 70%)",

    item: "linear-gradient(145deg, rgba(255,255,255,.05), rgba(255,255,255,.02))",
    itemActive: "linear-gradient(145deg, rgba(59,130,246,.28), rgba(59,130,246,.12))",

    border: "rgba(160,170,190,.2)",
    text: "#e4e9f5",
    muted: "#9ca3af",
    shadow: "0 12px 36px rgba(0,0,0,.45)",
  };

  /* Mapa de rol numérico -> string */
  const ROLE_MAP = {
    1: "ADMIN",
    2: "STAFF",
    3: "COORD",
    4: "TSOCIAL",
    5: "INV",
    6: "COMPRAS",
    7: "PROD",
    8: "LECTOR",
  };

  const roleCode = ROLE_MAP[user?.rol] || String(user?.rol || "");
  const isAdmin = roleCode === "ADMIN";

  /* Filtrado de menú (admin ve todo) */
  const groups = useMemo(() => {
    return MENU
      .map((g) => ({
        ...g,
        items: g.items.filter((it) => isAdmin || !it.roles || it.roles.includes(roleCode)),
      }))
      .filter((g) => g.items.length > 0);
  }, [roleCode, isAdmin]);

  /* shimmer posicional */
  const onMouseMove = useCallback((e) => {
    const t = e.currentTarget;
    const r = t.getBoundingClientRect();
    t.style.setProperty("--x", `${e.clientX - r.left}px`);
    t.style.setProperty("--y", `${e.clientY - r.top}px`);
  }, []);

  return (
    <aside
      className="sidebar"
      style={{
        height: "100%",
        width: collapsed ? 86 : 270,
        borderRadius: 18,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transition: "width .25s ease",
        background: `${SB.bg}, ${SB.overlay1}, ${SB.overlay2}`,
        backgroundBlendMode: "normal, overlay, overlay",
        border: "none",
        // (Quitamos el borderRadius duplicado para evitar el warning de Vite)
        color: SB.text,
        boxShadow: "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* BRAND */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: ".8rem .6rem",
          borderRadius: 14,
          background: "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.03))",
          border: `1px solid ${SB.border}`,
          boxShadow: "0 2px 12px rgba(0,0,0,.35)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: -80,
            width: 80,
            height: "100%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,.25), transparent)",
            transform: "skewX(-20deg)",
            animation: "glint 4s linear infinite",
          }}
        />
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            border: `2px solid ${SB.primary}`,
            background: "#0e162c",
            boxShadow: "0 0 14px rgba(11,77,170,.28)",
            flex: "0 0 auto",
            overflow: "hidden",
            display: "grid",
            placeItems: "center",
          }}
        >
          <img
            src="/images/luz.png"
            alt="Luz y Vida"
            style={{ width: "88%", height: "88%", objectFit: "contain" }}
          />
        </div>
        {!collapsed && (
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontWeight: 900, color: SB.text, letterSpacing: 0.4 }}>Luz & Vida</div>
            <div style={{ fontSize: 12, color: SB.muted }}>Gestión Administrativa</div>
          </div>
        )}
        <button
          className="btn btn-ghost"
          onClick={() => setCollapsed((v) => !v)}
          style={{ marginLeft: "auto", color: SB.muted, fontWeight: 800 }}
          title={collapsed ? "Expandir" : "Colapsar"}
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {/* MENÚ */}
      <nav style={{ display: "grid", gap: 10, overflowY: "auto" }}>
        {groups.map((group) => (
          <div key={group.title} style={{ display: "grid", gap: 6 }}>
            {!collapsed && (
              <div
                style={{
                  fontSize: 11,
                  color: SB.muted,
                  padding: "0 .4rem",
                  fontWeight: 800,
                  letterSpacing: 0.6,
                }}
              >
                {group.title.toUpperCase()}
              </div>
            )}
            <div style={{ display: "grid", gap: 6 }}>
              {group.items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.to === "/"}
                  className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
                  style={{ textDecoration: "none", color: "inherit" }}
                  title={collapsed ? it.label : undefined}
                >
                  {({ isActive }) => (
                    <div
                      className="sb-item"
                      onMouseMove={onMouseMove}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: ".62rem .7rem",
                        borderRadius: 12,
                        border: `1px solid ${SB.border}`,
                        background: isActive ? SB.itemActive : SB.item,
                        transition: "all .25s ease",
                        boxShadow: isActive
                          ? "0 8px 18px rgba(11,77,170,.34)"
                          : "0 1px 5px rgba(0,0,0,.35)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: 4,
                          height: 28,
                          borderRadius: 4,
                          background: isActive ? SB.primary : "transparent",
                          transition: "background .25s ease",
                        }}
                      />
                      <div
                        style={{
                          display: "grid",
                          placeItems: "center",
                          width: 22,
                          color: isActive ? SB.primary : SB.text,
                        }}
                      >
                        <Icon name={it.icon} />
                      </div>
                      {!collapsed && (
                        <span
                          style={{
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {it.label}
                        </span>
                      )}
                      {/* brillo al hover */}
                      <div
                        aria-hidden
                        className="sb-hover"
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "radial-gradient(600px 100px at var(--x, 0px) var(--y, 0px), rgba(255,255,255,.08), transparent 40%)",
                          opacity: 0,
                          transition: "opacity .25s ease",
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* PIE */}
      <div style={{ marginTop: "auto", opacity: 0.96 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: ".55rem .6rem",
            borderRadius: 12,
            border: `1px solid ${SB.border}`,
            background:
              "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "#0f1a30",
              border: `2px solid ${SB.primary}`,
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
            }}
          >
            <img src="/images/luz.png" alt="" style={{ width: "85%", height: "85%" }} />
          </div>
          {!collapsed && (
            <div style={{ fontSize: 12, lineHeight: 1.15 }}>
              <div style={{ fontWeight: 700, color: SB.text }}>
                {user?.nombre_usuario || "Usuario"}
              </div>
              <div style={{ color: SB.muted }}>{roleCode || "—"}</div>
            </div>
          )}
          {!collapsed && (
            <div style={{ marginLeft: "auto", opacity: 0.85, color: SB.muted }}>
              <Icon name="Settings" />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes glint {
          0%, 70% { transform: translateX(-80px) skewX(-20deg); }
          100% { transform: translateX(260px) skewX(-20deg); }
        }
        .sb-item:hover .sb-hover { opacity: 1; }
      `}</style>
    </aside>
  );
}
