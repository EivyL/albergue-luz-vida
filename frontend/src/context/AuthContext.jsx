// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  });

  // NUEVO: permisos/menús
  const [menus, setMenus] = useState(() => {
    try { return JSON.parse(localStorage.getItem("menus") || "[]"); }
    catch { return []; }
  });

  const [loading, setLoading] = useState(false);

  // Persistencia + header Authorization para Axios
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      localStorage.removeItem("token");
      delete api.defaults.headers.common.Authorization;
    }
  }, [token]);

  useEffect(() => {
    user
      ? localStorage.setItem("user", JSON.stringify(user))
      : localStorage.removeItem("user");
  }, [user]);

  // NUEVO: persistir menús
  useEffect(() => {
    (menus && menus.length)
      ? localStorage.setItem("menus", JSON.stringify(menus))
      : localStorage.removeItem("menus");
  }, [menus]);

  const login = async ({ correo, contrasena }) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { correo, contrasena });
      const payloadUser = data.usuario ?? data.user ?? null;
      if (!data.token || !payloadUser) throw new Error("Respuesta de login inválida");

      setToken(data.token);
      setUser(payloadUser);
      setMenus(data.menus || []);               // <<--- IMPORTANTE

      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setMenus([]);
  };

  // Helpers de permisos para que el UI esté más limpio
  const can = (clave, perm = "can_read") =>
    !!menus.find(m => m.clave === clave && m[perm]);

  const value = { token, user, menus, can, login, logout, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
