import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import DevErrorBoundary from "./DevErrorBoundary";

import DashboardLayout from "./components/DashboardLayout";
import Home from "./screens/Home";
import Login from "./screens/Login";

import Users from "./screens/Users";
import Beneficiarios from "./screens/Beneficiarios";
import Inventario from "./screens/Inventario";
import Compras from "./screens/Compras";
import Produccion from "./screens/Produccion";

export function Private({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}
export function GuestOnly({ children }) {
  const { token } = useAuth();
  return token ? <Navigate to="/" replace /> : children;
}
export function RequireRole({ roles, children }) {
  const { user } = useAuth();
  return roles.includes(user?.rol) ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <DevErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />

            <Route path="/" element={<Private><DashboardLayout><Home /></DashboardLayout></Private>} />

            <Route path="/admin/usuarios" element={
              <Private><RequireRole roles={["ADMIN"]}>
                <DashboardLayout><Users /></DashboardLayout>
              </RequireRole></Private>
            }/>

            <Route path="/beneficiarios" element={
              <Private><RequireRole roles={["ADMIN","COORD","TSOCIAL"]}>
                <DashboardLayout><Beneficiarios /></DashboardLayout>
              </RequireRole></Private>
            }/>

            <Route path="/inventario" element={
              <Private><RequireRole roles={["ADMIN","INV"]}>
                <DashboardLayout><Inventario /></DashboardLayout>
              </RequireRole></Private>
            }/>

            <Route path="/compras" element={
              <Private><RequireRole roles={["ADMIN","COMPRAS"]}>
                <DashboardLayout><Compras /></DashboardLayout>
              </RequireRole></Private>
            }/>

            <Route path="/produccion" element={
              <Private><RequireRole roles={["ADMIN","PROD"]}>
                <DashboardLayout><Produccion /></DashboardLayout>
              </RequireRole></Private>
            }/>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </DevErrorBoundary>
  );
}
