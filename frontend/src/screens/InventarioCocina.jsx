// frontend/src/screens/InventarioCocina.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../api";

const AREA = "COCINA";

/* ===== Utils ===== */
const toIso = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const daysBetween = (a, b = new Date()) => {
  if (!a) return null;
  const d1 = new Date(toIso(a));
  const d2 = new Date(toIso(b));
  return Math.ceil((d1 - d2) / (1000 * 60 * 60 * 24));
};
const fmtDate = (d) => (d ? toIso(d) : "—");

export default function InventarioCocina() {
  /* filtros y estado */
  const [q, setQ] = useState("");
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  /* crear ítem */
  const [f, setF] = useState({
    nombre: "",
    categoria: "",
    unidad: "kg",
    perishable: true,
    fechaCaducidad: "",
    ubicacion: "",
    minStock: 0,
  });

  /* movimiento */
  const [mov, setMov] = useState({
    tipo: "INGRESO",
    cantidad: "",
    motivo: "",
    referencia: "",
  });
  const [sel, setSel] = useState(null);

  /* cargar inventario */
  const cargar = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/inventario/items", {
        params: { area: AREA, q },
      });
      setLista(data?.items || []);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Error al cargar inventario de cocina");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { cargar(); }, []);

  /* crear ítem */
  const crear = async (ev) => {
    ev.preventDefault();
    setErr(""); setMsg("");
    try {
      const body = {
        ...f,
        area: AREA,
        fechaCaducidad: f.perishable ? (toIso(f.fechaCaducidad) || null) : null,
        minStock: Number(f.minStock || 0),
      };
      await api.post("/inventario/items", body);
      setMsg("Ítem creado");
      setF({ nombre:"", categoria:"", unidad:"kg", perishable:true, fechaCaducidad:"", ubicacion:"", minStock:0 });
      cargar();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "No se pudo crear el ítem");
    }
  };

  /* aplicar movimiento */
  const aplicarMov = async (ev) => {
    ev.preventDefault();
    if (!sel) return;
    setErr(""); setMsg("");
    try {
      const body = {
        ...mov,
        cantidad: Number(mov.cantidad || 0),
      };
      await api.post(`/inventario/items/${sel.id}/movimientos`, body, { params: { area: AREA } });
      setMsg("Movimiento aplicado");
      setMov({ tipo:"INGRESO", cantidad:"", motivo:"", referencia:"" });
      setSel(null);
      cargar();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "No se pudo aplicar el movimiento");
    }
  };

  /* KPIs */
  const kpi = useMemo(() => {
    const totalItems = lista.length;
    const totalStock = lista.reduce((s, x) => s + Number(x.stock || 0), 0);
    const low = lista.filter(x => Number(x.stock) <= Number(x.min_stock || 0)).length;
    const soon = lista.filter(x => {
      const d = daysBetween(x.fecha_caducidad);
      return x.perishable && d !== null && d <= 7;
    }).length;
    return { totalItems, totalStock, low, soon };
  }, [lista]);

  /* impresión */
  const printList = () => {
    const html = `
<!doctype html><html>
<head><meta charset="utf-8"/><title>Inventario Cocina</title>
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
  <h1>Inventario — Cocina</h1>
  <div class="muted">Generado: ${toIso(new Date())}</div><br/>
  <table>
    <thead><tr>
      <th>Nombre</th><th>Categoría</th><th>Unidad</th><th>Stock</th><th>Mín</th><th>Caduca</th><th>Ubicación</th>
    </tr></thead>
    <tbody>
      ${lista.map(it => `
        <tr>
          <td>${it.nombre}</td>
          <td>${it.categoria || "—"}</td>
          <td>${it.unidad || "—"}</td>
          <td>${it.stock}</td>
          <td>${it.min_stock}</td>
          <td>${fmtDate(it.fecha_caducidad)}</td>
          <td>${it.ubicacion || "—"}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
  <script>window.print()</script>
</body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="container section">
      {/* Header + acciones */}
      <div className="panel" style={{ padding: 16 }}>
        <div className="toolbar" style={{ justifyContent: "space-between" }}>
          <h1 className="h1">Inventario — Cocina</h1>
          <div className="toolbar" style={{ gap: 8, flexWrap: "wrap" }}>
            <input
              className="input"
              style={{ minWidth: 260 }}
              placeholder="Buscar insumo por nombre, categoría o ubicación…"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
            />
            <button className="btn btn-outline" onClick={cargar} disabled={loading}>Buscar</button>

            <a href={`${api.defaults.baseURL}/inventario/export.csv?area=${encodeURIComponent(AREA)}&q=${encodeURIComponent(q)}`} target="_blank" rel="noreferrer">
              <button type="button" className="btn btn-ghost">⬇️ CSV</button>
            </a>
            <button type="button" className="btn btn-ghost" onClick={printList}>🖨️ Imprimir</button>
          </div>
        </div>

        {/* KPIs */}
        <div className="toolbar" style={{ marginTop: 10 }}>
          <div className="kpi kpi-total"><div>Total ítems</div><div>{kpi.totalItems}</div></div>
          <div className="kpi kpi-ok"><div>Stock total</div><div>{kpi.totalStock}</div></div>
          <div className="kpi kpi-warn"><div>Por caducar (≤7 días)</div><div>{kpi.soon}</div></div>
          <div className="kpi kpi-danger"><div>Bajo stock</div><div>{kpi.low}</div></div>
          {msg && <span className="badge badge-success">✔ {msg}</span>}
          {err && <span className="badge badge-warning">⚠ {err}</span>}
        </div>
      </div>

      {/* Formularios */}
      <div className="grid-2" style={{ gap: 16, marginTop: 12 }}>
        {/* Agregar insumo */}
        <form onSubmit={crear} className="card elevate">
          <div className="toolbar" style={{ justifyContent: "space-between" }}>
            <div className="h2">Agregar insumo</div>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>

          <div className="form-grid cols-3" style={{ marginTop: 12 }}>
            <div>
              <label className="label">Nombre*</label>
              <input className="input" required value={f.nombre}
                     onChange={e=>setF({...f, nombre:e.target.value})}/>
            </div>
            <div>
              <label className="label">Categoría</label>
              <input className="input" value={f.categoria}
                     onChange={e=>setF({...f, categoria:e.target.value})}/>
            </div>
            <div>
              <label className="label">Unidad</label>
              <input className="input" value={f.unidad}
                     onChange={e=>setF({...f, unidad:e.target.value})}/>
            </div>

            <div>
              <label className="label">Perecedero</label>
              <div className="toolbar">
                <input
                  id="chkPer"
                  type="checkbox"
                  checked={f.perishable}
                  onChange={e=>setF({...f, perishable:e.target.checked, fechaCaducidad: e.target.checked? f.fechaCaducidad : ""})}
                />
                <label htmlFor="chkPer" style={{cursor:"pointer"}}>Sí</label>
              </div>
            </div>
            <div>
              <label className="label">Fecha caducidad</label>
              <input className="input" type="date" disabled={!f.perishable}
                     value={f.fechaCaducidad || ""} onChange={e=>setF({...f, fechaCaducidad:e.target.value})}/>
            </div>
            <div>
              <label className="label">Ubicación</label>
              <input className="input" value={f.ubicacion}
                     onChange={e=>setF({...f, ubicacion:e.target.value})}/>
            </div>

            <div>
              <label className="label">Stock mínimo</label>
              <input className="input" type="number" min={0}
                     value={f.minStock}
                     onChange={e=>setF({...f, minStock: parseInt(e.target.value||"0")})}/>
            </div>
          </div>
        </form>

        {/* Movimiento */}
        <form onSubmit={aplicarMov} className="card elevate">
          <div className="toolbar" style={{ justifyContent: "space-between" }}>
            <div className="h2">Movimiento</div>
            <button type="submit" className="btn btn-primary" disabled={!sel}>Aplicar</button>
          </div>

          <div className="form-grid cols-2" style={{ marginTop: 12 }}>
            <div>
              <label className="label">Insumo</label>
              <select className="select"
                value={sel?.id || ""}
                onChange={e=>setSel(lista.find(x=>String(x.id)===e.target.value) || null)}>
                <option value="">Selecciona un insumo</option>
                {lista.map(it => (
                  <option key={it.id} value={it.id}>{it.nombre} — stock {it.stock}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tipo</label>
              <select className="select" value={mov.tipo} onChange={e=>setMov({...mov, tipo:e.target.value})}>
                <option>INGRESO</option>
                <option>EGRESO</option>
                <option>AJUSTE</option>
              </select>
            </div>

            <div>
              <label className="label">Cantidad</label>
              <input className="input" type="number" min={1}
                     value={mov.cantidad}
                     onChange={e=>setMov({...mov, cantidad: e.target.value})}/>
            </div>
            <div>
              <label className="label">Motivo</label>
              <input className="input" value={mov.motivo}
                     onChange={e=>setMov({...mov, motivo:e.target.value})}/>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label">Referencia (Factura / OC / Nota)</label>
              <input className="input" value={mov.referencia}
                     onChange={e=>setMov({...mov, referencia:e.target.value})}/>
            </div>
          </div>
        </form>
      </div>

      {/* Tabla */}
      <div className="panel" style={{ padding: 0, marginTop: 16 }}>
        <div style={{ padding: 12, borderBottom: "1px solid var(--lv-border)" }}>
          <div className="h2">Insumos</div>
        </div>

        <div style={{ overflow: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Unidad</th>
                <th>Stock</th>
                <th>Mín</th>
                <th>Caduca</th>
                <th>Ubicación</th>
                <th>Alertas</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((it) => {
                const low = Number(it.stock) <= Number(it.min_stock || 0);
                const dLeft = it.perishable ? daysBetween(it.fecha_caducidad) : null;
                const soon = it.perishable && dLeft !== null && dLeft <= 7;
                return (
                  <tr key={it.id}
                      style={{ background: low ? "rgba(239,68,68,.06)" : "transparent" }}>
                    <td style={{ fontWeight: 800 }}>{it.nombre}</td>
                    <td>{it.categoria || "—"}</td>
                    <td>{it.unidad || "—"}</td>
                    <td>{it.stock}</td>
                    <td>{it.min_stock}</td>
                    <td>{fmtDate(it.fecha_caducidad)}</td>
                    <td>{it.ubicacion || "—"}</td>
                    <td>
                      <div className="toolbar" style={{ gap: 6 }}>
                        {low && <span className="badge badge-warning">Bajo stock</span>}
                        {soon && <span className="badge badge-danger">Caduca en {dLeft}d</span>}
                        {!low && !soon && <span className="muted">—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && lista.length === 0 && (
                <tr><td colSpan={8} className="muted">Sin resultados</td></tr>
              )}
              {loading && (
                <tr><td colSpan={8} className="muted">Cargando…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
