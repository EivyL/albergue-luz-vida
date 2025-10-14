// frontend/src/screens/Users.jsx
import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext"; // para saber quién es el usuario actual

export default function Users() {
  const { user } = useAuth();
  const meId = user?.id_usuario ?? user?.id ?? null;

  const [q, setQ] = useState("");
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  // ---- formulario SIEMPRE vacío
  const emptyForm = { nombre_usuario: "", correo: "", contrasena: "", rol: "STAFF" };
  const [f, setF] = useState(emptyForm);
  const [formKey, setFormKey] = useState(0); // fuerza remount del form (anti-autofill)

  const cargar = async () => {
    setLoading(true); setErr("");
    try {
      const { data } = await api.get("/usuarios", { params: { q } });
      setLista(data.items || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // al entrar, garantizamos formulario limpio y “nuevo”
    setF(emptyForm);
    setFormKey(k => k + 1);
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const crear = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");
    try {
      await api.post("/usuarios", f);
      setMsg("Usuario creado");
      setF(emptyForm);
      setFormKey(k => k + 1);   // 🔑 vuelve a montar el form -> inputs vacíos
      await cargar();
    } catch (e) {
      setErr(e?.response?.data?.message || "Error creando usuario");
    }
  };

  const toggle = async (id) => {
    if (Number(id) === Number(meId)) {
      alert("No puedes desactivar tu propia cuenta.");
      return;
    }
    try {
      await api.patch(`/usuarios/${id}/estado`);
      await cargar();
    } catch (e) {
      alert(e?.response?.data?.message || "No se pudo cambiar estado");
    }
  };

  const resetPass = async (id) => {
    const nueva = prompt("Nueva contraseña:");
    if (!nueva) return;
    try {
      await api.patch(`/usuarios/${id}/password`, { nueva });
      alert("Contraseña actualizada");
    } catch (e) {
      alert(e?.response?.data?.message || "No se pudo actualizar la contraseña");
    }
  };

  const eliminar = async (id) => {
    if (Number(id) === Number(meId)) {
      alert("No puedes eliminar tu propia cuenta.");
      return;
    }
    if (!confirm("¿Ocultar este usuario? (no se elimina de la BD)")) return;
    try {
      await api.delete(`/usuarios/${id}`); // hace soft-delete (estado=false)
      await cargar();
    } catch (e) {
      alert(e?.response?.data?.message || "No se pudo ocultar");
    }
  };

  const Badge = ({ tone="success", children }) => (
    <span className={`badge ${tone==="success" ? "badge-success" : "badge-warning"}`}>{children}</span>
  );

  return (
    <div className="container" style={{ paddingTop: 8 }}>
      {/* Crear usuario */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{fontWeight:700, marginBottom:8}}>Crear usuario</h3>

        {/* key fuerza remount y evita autofill */}
        <form key={formKey} onSubmit={crear}
              className="grid" style={{ gridTemplateColumns:"repeat(4, minmax(0,1fr))", gap:12 }}
              autoComplete="off">

          <div style={{display:"grid", gap:6}}>
            <label className="lbl">Nombre de usuario *</label>
            <input
              className="input"
              name={`nombre_usuario_${formKey}`}      // evita que el navegador “reconozca” el campo
              autoComplete="off"
              placeholder="usuario"
              value={f.nombre_usuario}
              onChange={(e)=>setF({...f, nombre_usuario: e.target.value})}
              required
            />
          </div>

          <div style={{display:"grid", gap:6}}>
            <label className="lbl">Correo *</label>
            <input
              type="email"
              className="input"
              name={`correo_${formKey}`}
              autoComplete="off"
              placeholder="correo@dominio.com"
              value={f.correo}
              onChange={(e)=>setF({...f, correo: e.target.value})}
              required
            />
          </div>

          <div style={{display:"grid", gap:6}}>
            <label className="lbl">Contraseña *</label>
            <input
              type="password"
              className="input"
              name={`contrasena_${formKey}`}
              autoComplete="new-password"            // 👈 importante
              placeholder="••••••••"
              value={f.contrasena}
              onChange={(e)=>setF({...f, contrasena: e.target.value})}
              required
            />
          </div>

          <div style={{display:"grid", gap:6}}>
            <label className="lbl">Rol</label>
            <select
              className="select"
              name={`rol_${formKey}`}
              autoComplete="off"
              value={f.rol}
              onChange={(e)=>setF({...f, rol: e.target.value})}
            >
              <option value="STAFF">STAFF</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div style={{ gridColumn:"1 / -1", display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button className="btn btn-primary" type="submit">Crear</button>
          </div>
        </form>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"center"}}>
          <input className="input" placeholder="Buscar por nombre/correo"
                 style={{maxWidth:380}} value={q} onChange={(e)=>setQ(e.target.value)} />
          <button className="btn" onClick={cargar}>Buscar</button>
          <button className="btn btn-ghost" onClick={()=>{ setQ(""); cargar(); }}>Limpiar</button>
        </div>
        {err && <div className="card" style={{borderColor:"rgba(239,68,68,.45)", marginTop:12, color:"var(--lv-danger)"}}>{err}</div>}
        {msg && <div className="card" style={{borderColor:"rgba(34,197,94,.45)", marginTop:12, color:"var(--lv-success)"}}>{msg}</div>}
      </div>

      {/* Listado */}
      <div className="panel">
        {loading ? (
          <div style={{display:"flex", alignItems:"center", gap:8, padding:12}}>
            <div className="spinner" /> Cargando…
          </div>
        ) : (
          <div style={{overflowX:"auto"}}>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Último login</th><th style={{width:300}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
              {lista.length===0 && (
                <tr><td colSpan="7" style={{opacity:.7, padding:"1rem"}}>Sin datos</td></tr>
              )}
              {lista.map((u)=>(
                <tr key={u.id_usuario}>
                  <td>{u.id_usuario}</td>
                  <td>{u.nombre_usuario}</td>
                  <td>{u.correo}</td>
                  <td>{u.rol}</td>
                  <td>{u.estado ? <Badge>Activo</Badge> : <Badge tone="warning">Inactivo</Badge>}</td>
                  <td>{u.ultimo_login ? new Date(u.ultimo_login).toLocaleString() : "-"}</td>
                  <td>
                    <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                      <button className="btn btn-ghost"
                              disabled={u.id_usuario===meId}
                              title={u.id_usuario===meId ? "No puedes desactivar tu propia cuenta" : ""}
                              onClick={()=>toggle(u.id_usuario)}>
                        {u.estado ? "Desactivar" : "Activar"}
                      </button>
                      <button className="btn btn-ghost" onClick={()=>resetPass(u.id_usuario)}>
                        Reset pass
                      </button>
                      {u.id_usuario !== meId && (
                        <button className="btn" style={{background:"var(--lv-danger)", borderColor:"transparent"}}
                                onClick={()=>eliminar(u.id_usuario)}>
                          Ocultar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
