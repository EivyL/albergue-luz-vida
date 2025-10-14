// src/screens/Login.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./login.css";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ❌ antes: "admin@albergue.test" y "Admin123*"
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  // refs para forzar limpieza contra autofill agresivo de Chrome
  const emailRef = useRef(null);
  const passRef  = useRef(null);

  // Limpia cada vez que entras a /login
  useEffect(() => {
    setCorreo("");
    setContrasena("");
    setShowPass(false);
    setError("");

    // extra: borra cualquier autofill visual tardío del navegador
    const t = setTimeout(() => {
      if (emailRef.current) emailRef.current.value = "";
      if (passRef.current) passRef.current.value = "";
    }, 50);
    return () => clearTimeout(t);
  }, [location.key]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!correo.trim()) return setError("El correo es requerido.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
      return setError("Ingresa un correo válido.");
    if (!contrasena) return setError("La contraseña es requerida.");
    try {
      await login({ correo, contrasena });
      // opcional: limpia al salir también
      setContrasena("");
      setCorreo("");
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || "Usuario o contraseña incorrectos. Inténtalo de nuevo.";
      setError(msg);
      // por seguridad, vacía el password después del error
      setContrasena("");
      if (passRef.current) passRef.current.value = "";
    }
  };

  return (
    <div className="login__wrap">
      <div className="login__card">
        <div className="login__header">
          <img src="/images/luz.png" alt="logo" />
          <h1>ALBERGUE LUZ Y VIDA</h1>
          <p className="muted">Accede para administrar el sistema</p>
        </div>

        {/* autocomplete off para el form e inputs */}
        <form className="login__form" onSubmit={onSubmit} autoComplete="off">
          <label className="field">
            <span>Correo</span>
            <input
              ref={emailRef}
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="Ingresa tu correo electronico"
              autoComplete="off"    // <- importante
              autoCorrect="off"
              autoCapitalize="none"
            />
          </label>

          <label className="field">
            <span>Contraseña</span>
            <div className="password">
              <input
                ref={passRef}
                type={showPass ? "text" : "password"}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"  // evita autofill
              />
              <button
                type="button"
                className="ghost"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </label>

          {error && <div className="error">{error}</div>}

          <button className="primary" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="login__footer">
          <small className="muted">¿Olvidaste tu contraseña? Contacta al administrador.</small>
        </div>
      </div>
    </div>
  );
}
