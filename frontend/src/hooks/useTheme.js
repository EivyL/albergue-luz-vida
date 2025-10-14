// src/hooks/useTheme.js
import { useEffect, useState } from "react";

const STORAGE_KEY = "lv-theme"; // 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
    // Si no hay guardado, usa preferencia del sistema
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    return prefersDark ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Escucha cambios del SO (opcional)
  useEffect(() => {
    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mql) return;
    const onChange = (e) => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) setTheme(e.matches ? "dark" : "light"); // solo si el usuario no forzó uno
    };
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, setTheme, toggle };
}
