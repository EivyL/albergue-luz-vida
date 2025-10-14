// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import DevErrorBoundary from "./DevErrorBoundary";

import DashboardLayout from "./components/DashboardLayout";
import Login from "./screens/Login";

import Home from "./screens/Home";
import Users from "./screens/Users";
import Beneficiarios from "./screens/Beneficiarios";
import Inventario from "./screens/Inventario";
import Compras from "./screens/Compras";
import Produccion from "./screens/Produccion";
import Estadisticas from "./screens/Estadisticas";
import HabitacionesLista from "./screens/HabitacionesLista.jsx";
import Habitaciones from "./screens/Habitaciones.jsx";
import InventarioCocina from "./screens/InventarioCocina.jsx";
import Bodega from "./screens/Bodega.jsx";

// --- Guards ---
export function Private({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export function GuestOnly({ children }) {
  const { token } = useAuth();
  return token ? <Navigate to="/" replace /> : children;
}

export function RequireRole({ roles = [], children }) {
  const { user } = useAuth();
  const userRole = String(user?.rol || "").toUpperCase();
  const allowed = roles.map(r => String(r).toUpperCase());
  return allowed.includes(userRole) ? children : <Navigate to="/" replace />;
}

// --- App ---
export default function App() {
  return (
    <DevErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Público */}
            <Route
              path="/login"
              element={
                <GuestOnly>
                  <Login />
                </GuestOnly>
              }
            />

            {/* Inicio (privado) */}
            <Route
              path="/"
              element={
                <Private>
                  <DashboardLayout>
                    <Home />
                  </DashboardLayout>
                </Private>
              }
            />

            {/* Estadísticas */}
            <Route
              path="/estadisticas"
              element={
                <Private>
                  <RequireRole roles={["ADMIN", "COORD"]}>
                    <DashboardLayout>
                      <Estadisticas />
                    </DashboardLayout>
                  </RequireRole>
                </Private>
              }
            />

            {/* Usuarios (solo ADMIN) */}
            <Route
              path="/admin/usuarios"
              element={
                <Private>
                  <RequireRole roles={["ADMIN"]}>
                    <DashboardLayout>
                      <Users />
                    </DashboardLayout>
                  </RequireRole>
                </Private>
              }
            />

            {/* Beneficiarios */}
            <Route
              path="/beneficiarios"
              element={
                <Private>
                  <RequireRole roles={["ADMIN", "COORD", "TSOCIAL"]}>
                    <DashboardLayout>
                      <Beneficiarios />
                    </DashboardLayout>
                  </RequireRole>
                </Private>
              }
            />

            {/* Habitaciones (nuevo módulo unificado) */}
            <Route
              path="/habitaciones"
              element={
                <Private>
                  <RequireRole roles={["ADMIN", "COORD", "TSOCIAL"]}>
                    <DashboardLayout>
                      <Habitaciones />
                    </DashboardLayout>
                  </RequireRole>
                </Private>
              }
            />

            {/* (Opcional) Lista y Literas si aún las usas en paralelo */}
            <Route
              path="/habitaciones/lista"
              element={
                <Private>
                  <RequireRole roles={["ADMIN", "COORD", "TSOCIAL"]}>
                    <DashboardLayout>
                      <HabitacionesLista />
                    </DashboardLayout>
                  </RequireRole>
                </Private>
              }
            />

            {/* Inventario */}
            <Route
              path="/inventario"
              element={
                <Private>
                  <RequireRole roles={["ADMIN", "INV"]}>
                    <DashboardLayout>
                      <Inventario />
                    </DashboardLayout>
                  </RequireRole>
                </Private>
              }
            />

              <Route
                path="/inventario/cocina"
                element={
                  <DashboardLayout>
                    <InventarioCocina />
                  </DashboardLayout>
                }
              />

              <Route
                path="/bodega"
                element={
                  <DashboardLayout>
                    <Bodega />
                  </DashboardLayout>
                }
              />

            {/* Compras */}
            <Route
              path="/compras"
              element={
                <Private>
                  <RequireRole roles={["ADMIN", "COMPRAS"]}>
                    <DashboardLayout>
                      <Compras />
                    </DashboardLayout>
                  </RequireRole>
                </Private>
              }
            />

            {/* Producción */}
            <Route
              path="/produccion"
              element={
                <Private>
                  <RequireRole roles={["ADMIN", "PROD"]}>
                    <DashboardLayout>
                      <Produccion />
                    </DashboardLayout>
                  </RequireRole>
                </Private>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </DevErrorBoundary>
  );
}
