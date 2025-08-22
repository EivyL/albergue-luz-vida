
// src/screens/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./login.css";
export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("admin@albergue.test");
  const [contrasena, setContrasena] = useState("Admin123*");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    // Validaciones simples
    if (!correo.trim()) return setError("El correo es requerido.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
      return setError("Ingresa un correo válido.");
    if (!contrasena) return setError("La contraseña es requerida.");
    try {
      await login({ correo, contrasena });
      navigate("/", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Usuario o contraseña incorrectos. Inténtalo de nuevo.";
      setError(msg);
    }
  };
  return (
    <div className="login__wrap">
      <div className="login__card">
        <div className="login__header">
          <img
            src="https://cdn-icons-png.flaticon.com/512/1047/1047711.png"
            alt="logo"
          />
          <h1>Albergue Luz y Vida</h1>
          <p className="muted">Accede para administrar el sistema</p>
        </div>
        <form className="login__form" onSubmit={onSubmit}>
          <label className="field">
            <span>Correo</span>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="tucorreo@dominio.com"
              autoFocus
            />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <div className="password">
              <input
                type={showPass ? "text" : "password"}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="••••••••"
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
          <small className="muted">
            ¿Olvidaste tu contraseña? Contacta al administrador.
          </small>
        </div>
      </div>
    </div>
  );
}
