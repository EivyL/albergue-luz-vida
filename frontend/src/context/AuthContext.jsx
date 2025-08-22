import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => { token ? localStorage.setItem("token", token) : localStorage.removeItem("token"); }, [token]);
  useEffect(() => { user ? localStorage.setItem("user", JSON.stringify(user)) : localStorage.removeItem("user"); }, [user]);

  const login = async ({ correo, contrasena }) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { correo, contrasena });
      const payloadUser = data.usuario ?? data.user ?? null;
      if (!data.token || !payloadUser) throw new Error("Respuesta de login inválida");
      setToken(data.token);
      setUser(payloadUser);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => { setToken(null); setUser(null); };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
