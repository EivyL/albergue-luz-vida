import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleCode } from "../utils/roles";

/**
 * <ProtectedRoute allow={["ADMIN","COORD"]} />
 * - Si no hay token => /login
 * - Si hay token:
 *    - si no se pasa "allow": deja pasar
 *    - si se pasa "allow": deja pasar si el rol string está en allow
 */
export default function ProtectedRoute({ allow }) {
  const { token, user } = useAuth();
  const loc = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }

  if (!allow || allow.length === 0) {
    return <Outlet />;
  }

  const myRole = roleCode(user?.rol);
  if (allow.includes(myRole) || myRole === "ADMIN") {
    return <Outlet />;
  }

  // autenticado pero sin permiso → inicio
  return <Navigate to="/" replace />;
}
