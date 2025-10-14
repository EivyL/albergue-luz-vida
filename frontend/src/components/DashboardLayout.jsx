
// src/components/DashboardLayout.jsx
import React from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../hooks/useTheme";
import "../style/theme.css"; // << importa la hoja de temas
function Topbar({ onLogout }) {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const display =
  user?.usuario ||
  user?.nombre ||
  user?.nombres ||
  (user?.correo ? user.correo.split("@")[0] : "usuario");
const hour = new Date().getHours();
const saludo = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
return (
  <header style={{display:"flex",alignItems:"center",justifyContent:"space-between", padding:12, borderBottom:"1px solid var(--lv-border)"}}>
    <div style={{display:"flex", alignItems:"center", gap:12}}>
      <div style={{fontWeight:700, color:"##000000"}}>
        {saludo}, <span style={{ color:"var(--lv-primary)" }}>@{display}</span>
      </div>
    </div>
    <div style={{display:"flex", gap:8}}>
      <button onClick={onLogout} className="btn btn-ghost">Cerrar sesión</button>
    </div>
  </header>
);
}
export default function DashboardLayout({ children }) {
  const { logout } = useAuth();
  return (
    <div style={{display:"grid", gridTemplateColumns:"280px 1fr", minHeight:"100vh"}}>
      <Sidebar />
      <div style={{display:"grid", gridTemplateRows:"auto 1fr"}}>
        <Topbar onLogout={logout} />
        <main style={{padding:16}}>
          <div className="container">{children}</div>
        </main>
      </div>
    </div>
  );
}
