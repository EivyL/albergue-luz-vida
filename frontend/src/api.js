import axios from "axios";

const base = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, ""); // quita '/' final
if (!base) console.warn("⚠️ VITE_API_URL no está definida");

const api = axios.create({
  baseURL: `${base}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export default api;
