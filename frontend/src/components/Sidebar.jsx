import { Link, useLocation } from "react-router-dom";
import { MENU, can } from "../permissions";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <aside style={{ width: 240, padding: 16, borderRight: "1px solid #223", minHeight: "100vh", background: "#0f172a", color: "#e5e7eb" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700 }}>{user?.nombre}</div>
        <small>({user?.rol})</small>
      </div>
      <nav>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {MENU.filter(i => can(user, i.roles)).map(item => {
            const active = pathname === item.path || pathname.startsWith(item.path + "/");
            return (
              <li key={item.path} style={{ marginBottom: 8 }}>
                <Link to={item.path} style={{ textDecoration: "none", color: active ? "#22d3ee" : "#cbd5e1", fontWeight: active ? 700 : 400 }}>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <button onClick={logout} style={{ marginTop: 12, background: "#ef4444", color: "white", border: 0, padding: "8px 12px", borderRadius: 6, cursor: "pointer" }}>
        Salir
      </button>
    </aside>
  );
}
