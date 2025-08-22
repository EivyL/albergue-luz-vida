// src/guards/RequireRole.jsx
import { Navigate } from "react-router-dom";
export default function RequireRole({ user, roles, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.rol)) return <Navigate to="/403" replace />;
  return children;
}
