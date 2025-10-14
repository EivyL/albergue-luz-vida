// src/screens/Beneficiarios.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

/* ================ Helpers UI ================= */
const PillTab = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`tab ${active ? "is-active" : ""}`}
    style={{ minWidth: 96, justifyContent: "center" }}
  >
    {children}
  </button>
);

const Stat = ({ label, value, tone = "kpi-total" }) => (
  <div className={`kpi ${tone}`} style={{ border: "1px solid var(--lv-border)", borderRadius: 12 }}>
    <div style={{ fontSize: 12, fontWeight: 800, opacity: .8 }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 900 }}>{value}</div>
  </div>
);

const Label = ({ children }) => <label className="label">{children}</label>;

const Field = ({ label, children }) => (
  <div>
    <Label>{label}</Label>
    {children}
  </div>
);

/* ================ Utils ================= */
const today = () => new Date().toISOString().slice(0, 10);
const toIsoDate = (v) => (v ? new Date(v).toISOString().slice(0, 10) : "");
const calcAge = (birth) => {
  if (!birth) return "—";
  const d = new Date(birth);
  if (Number.isNaN(d.getTime())) return "—";
  const t = new Date();
  let age = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
  return age < 0 || age > 130 ? "—" : age;
};

/* ================ Componente ================= */
export default function Beneficiarios() {
  const { user } = useAuth();
  const userId = user?.id_usuario ?? user?.id ?? null;

  /* filtros/estado */
  const [sexo, setSexo] = useState("H");                // H | M
  const [estado, setEstado] = useState("ACTIVOS");      // ACTIVOS | INACTIVOS | TODOS
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  /* datos */
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  /* crear/editar rápido */
  const [form, setForm] = useState({
    nombre: "", apellido: "", sexo: "M",
    documento: "", telefono: "",
    direccion: "", programa: "",
    fecha_nacimiento: "", fecha_ingreso: today(),
    estado: true, observaciones: "",
    id_usuario: userId
  });
  const [editing, setEditing] = useState(null);

  /* imprenta (contenedor) */
  const printRef = useRef(null);

  /* carga */
  const cargar = async () => {
    setLoading(true);
    try {
      const params = {
        q, page, limit, sexo,
        estado: estado === "TODOS" ? undefined : (estado === "ACTIVOS")
      };
      const { data } = await api.get("beneficiarios", { params });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { cargar(); }, [sexo, estado, q, page, limit]);

  /* acciones CRUD */
  const onChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const resetForm = () => {
    setEditing(null);
    setForm({
      nombre: "", apellido: "", sexo: "M",
      documento: "", telefono: "", direccion: "", programa: "",
      fecha_nacimiento: "", fecha_ingreso: today(),
      estado: true, observaciones: "",
      id_usuario: userId
    });
  };

  const save = async () => {
    // validaciones mínimas y fechas seguras (evitar "Invalid date")
    if (!form.nombre || !form.apellido) return alert("Nombre y apellido son requeridos.");
    const payload = {
      ...form,
      fecha_ingreso: toIsoDate(form.fecha_ingreso) || today(),
      fecha_nacimiento: form.fecha_nacimiento ? toIsoDate(form.fecha_nacimiento) : null,
      id_usuario: form.id_usuario ?? userId
    };
    try {
      if (editing) {
        await api.put(`beneficiarios/${editing.id_beneficiario}`, payload);
        setMsg("Beneficiario actualizado");
      } else {
        await api.post("beneficiarios", payload);
        setMsg("Beneficiario creado");
      }
      resetForm();
      await cargar();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Error guardando");
    }
  };

  const onEdit = (row) => {
    setEditing(row);
    setForm({
      nombre: row.nombre ?? "",
      apellido: row.apellido ?? "",
      sexo: row.sexo ?? "M",
      documento: row.documento ?? "",
      telefono: row.telefono ?? "",
      direccion: row.direccion ?? "",
      programa: row.programa ?? "",
      fecha_nacimiento: toIsoDate(row.fecha_nacimiento) || "",
      fecha_ingreso: toIsoDate(row.fecha_ingreso) || today(),
      estado: row.estado ?? true,
      observaciones: row.observaciones ?? "",
      id_usuario: row.id_usuario ?? userId
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (row) => {
    if (!confirm(`¿Eliminar a ${row.nombre} ${row.apellido}?`)) return;
    try {
      await api.delete(`beneficiarios/${row.id_beneficiario}`);
      setMsg("Eliminado");
      await cargar();
    } catch (e) {
      alert(e?.response?.data?.message || "Error eliminando");
    }
  };

  /* KPIs */
  const kpis = useMemo(() => {
    const activos = items.filter((x) => x.estado).length;
    return {
      total: total,
      activos,
      inactivos: total - activos < 0 ? 0 : total - activos
    };
  }, [items, total]);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  /* imprimir listado */
  const printList = () => {
    const html = `
<!doctype html><html>
<head>
<meta charset="utf-8"/>
<title>Listado de Beneficiarios</title>
<style>
  body{font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin:24px;}
  h1{margin:0 0 12px 0; font-size:18px}
  table{width:100%; border-collapse:collapse; font-size:12px}
  th,td{padding:8px; border-bottom:1px solid #ddd; text-align:left}
  th{background:#f3f4f6}
  .muted{color:#6b7280; font-weight:500}
</style>
</head>
<body>
  <h1>Listado de Beneficiarios</h1>
  <div class="muted">Sexo: ${sexo === "H" ? "Hombres" : "Mujeres"} · Estado: ${estado.toLowerCase()}</div>
  <br/>
  <table>
    <thead><tr>
      <th>#</th><th>Nombre</th><th>Sexo</th><th>Edad</th><th>Documento</th>
      <th>Teléfono</th><th>Programa</th><th>Ingreso</th><th>Estado</th>
    </tr></thead>
    <tbody>
      ${items.map((r, i) => `
        <tr>
          <td>${(page - 1) * limit + i + 1}</td>
          <td>${(r.nombre ?? "")} ${(r.apellido ?? "")}</td>
          <td>${r.sexo === "H" ? "Hombre" : "Mujer"}</td>
          <td>${calcAge(r.fecha_nacimiento)}</td>
          <td>${r.documento ?? "—"}</td>
          <td>${r.telefono ?? "—"}</td>
          <td>${r.programa ?? "—"}</td>
          <td>${toIsoDate(r.fecha_ingreso) || "—"}</td>
          <td>${r.estado ? "Activo" : "Inactivo"}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
  <script>window.print();</script>
</body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="container section" ref={printRef}>
      {/* Encabezado */}
      <div className="panel" style={{ padding: 16 }}>
        <div className="toolbar" style={{ justifyContent: "space-between" }}>
          <h1 className="h1">Beneficiarios</h1>
          <div className="toolbar">
            {/* Tabs Sexo */}
            <div className="tabs">
              <PillTab active={sexo === "H"} onClick={() => { setSexo("H"); setPage(1); }}>Hombres</PillTab>
              <PillTab active={sexo === "M"} onClick={() => { setSexo("M"); setPage(1); }}>Mujeres</PillTab>
            </div>

            {/* Estado */}
            <select className="select" value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1); }} style={{ width: 160 }}>
              <option value="ACTIVOS">Activos</option>
              <option value="INACTIVOS">Inactivos</option>
              <option value="TODOS">Todos</option>
            </select>

            {/* Buscar */}
            <input
              className="input"
              style={{ minWidth: 320 }}
              placeholder="Buscar por nombre, apellido o documento…"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />

            {/* Tamaño página */}
            <select className="select" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} style={{ width: 120 }}>
              {[10, 20, 50].map((n) => <option key={n} value={n}>{n}/pág</option>)}
            </select>

            {/* Imprimir */}
            <button className="btn btn-outline" onClick={printList}>🖨️ Imprimir listado</button>
          </div>
        </div>

        {/* KPIs */}
        <div className="toolbar" style={{ marginTop: 10 }}>
          <Stat label="Total" value={kpis.total} tone="kpi-total" />
          <Stat label="Activos" value={kpis.activos} tone="kpi-ok" />
          <Stat label="Inactivos" value={kpis.inactivos} tone="kpi-warn" />
          {msg && <div className="badge badge-info">✔ {msg}</div>}
        </div>
      </div>

      {/* Registro rápido (Card elevada) */}
      <div className="card elevate">
        <div className="toolbar" style={{ justifyContent: "space-between" }}>
          <div className="h2">Registro rápido</div>
          {editing ? (
            <div className="toolbar">
              <button className="btn btn-ghost" onClick={resetForm}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>Guardar cambios</button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={save}>+ Registrar</button>
          )}
        </div>

        <div className="form-grid cols-4" style={{ marginTop: 12 }}>
          <Field label="Nombre*">
            <input className="input" name="nombre" value={form.nombre} onChange={onChange} required />
          </Field>
          <Field label="Apellido*">
            <input className="input" name="apellido" value={form.apellido} onChange={onChange} required />
          </Field>
          <Field label="Sexo*">
            <select className="select" name="sexo" value={form.sexo} onChange={onChange}>
              <option value="H">Hombre</option>
              <option value="M">Mujer</option>
            </select>
          </Field>
          <Field label="Documento">
            <input className="input" name="documento" value={form.documento} onChange={onChange} />
          </Field>

          <Field label="Teléfono">
            <input className="input" name="telefono" value={form.telefono} onChange={onChange} />
          </Field>
          <Field label="Programa">
            <input className="input" name="programa" value={form.programa} onChange={onChange} />
          </Field>
          <Field label="Nacimiento">
            <input type="date" className="input" name="fecha_nacimiento" value={form.fecha_nacimiento || ""} onChange={onChange} />
          </Field>
          <Field label="Ingreso*">
            <input type="date" className="input" name="fecha_ingreso" value={form.fecha_ingreso || ""} onChange={onChange} required />
          </Field>

          <Field label="Dirección">
            <input className="input" name="direccion" value={form.direccion} onChange={onChange} />
          </Field>
          <Field label="Estado">
            <div className="toolbar">
              <input id="chkEstado" type="checkbox" checked={!!form.estado} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.checked }))} />
              <label htmlFor="chkEstado" style={{ cursor: "pointer" }}>Activo</label>
            </div>
          </Field>
        </div>

        <div style={{ marginTop: 12 }}>
          <Label>Observaciones</Label>
          <textarea className="textarea" rows={3} name="observaciones" value={form.observaciones} onChange={onChange} placeholder="Notas médicas, alergias, referencias, etc." />
        </div>
      </div>

      {/* Tabla de resultados */}
      <div className="panel" style={{ padding: 0 }}>
        <div style={{ padding: 12, borderBottom: "1px solid var(--lv-border)" }}>
          <div className="h2">Listado</div>
        </div>

        <div style={{ overflow: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Sexo</th>
                <th>Edad</th>
                <th>Documento</th>
                <th>Teléfono</th>
                <th>Programa</th>
                <th>Ingreso</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!loading && items.map((r, i) => (
                <tr key={r.id_beneficiario}>
                  <td>{(page - 1) * limit + i + 1}</td>
                  <td>
                    <div style={{ fontWeight: 900 }}>{r.nombre} {r.apellido}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{r.direccion || "—"}</div>
                  </td>
                  <td>{r.sexo === "H" ? "Hombre" : "Mujer"}</td>
                  <td>{calcAge(r.fecha_nacimiento)}</td>
                  <td>{r.documento || "—"}</td>
                  <td>{r.telefono || "—"}</td>
                  <td>{r.programa || "—"}</td>
                  <td>{toIsoDate(r.fecha_ingreso) || "—"}</td>
                  <td>
                    {r.estado
                      ? <span className="badge badge-success">Activo</span>
                      : <span className="badge badge-warning">Inactivo</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="toolbar">
                      <button className="btn btn-ghost" onClick={() => onEdit(r)}>Editar</button>
                      <button className="btn btn-danger" onClick={() => onDelete(r)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr><td colSpan={10} className="muted">Cargando…</td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={10} className="muted">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="toolbar" style={{ padding: 12, justifyContent: "space-between" }}>
          <div className="muted">{total} resultado(s)</div>
          <div className="pager">
            <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
            <div style={{ fontWeight: 800 }}>{page}/{pages}</div>
            <button className="btn btn-ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
