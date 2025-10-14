// frontend/src/screens/Bodega.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../api";

/* ====== helpers ====== */
const printHTML = (rows) => {
  const html = `
<!doctype html><html>
<head><meta charset="utf-8"/><title>Listado — Bodega</title>
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
  <h1>Listado — Bodega</h1>
  <div class="muted">Generado: ${new Date().toISOString().slice(0,10)}</div><br/>
  <table>
    <thead><tr>
      <th>Nombre</th><th>Categoría</th><th>Unidad</th>
      <th>Talla</th><th>Color</th><th>Estado</th>
      <th>Stock</th><th>Mín</th><th>Ubicación</th>
    </tr></thead>
    <tbody>
      ${rows.map(it => `
        <tr>
          <td>${it.nombre}</td>
          <td>${it.categoria || "—"}</td>
          <td>${it.unidad || "—"}</td>
          <td>${it.talla || "—"}</td>
          <td>${it.color || "—"}</td>
          <td>${it.estado || "—"}</td>
          <td>${it.stock}</td>
          <td>${it.min_stock}</td>
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

export default function Bodega() {
  /* filtros/estado */
  const [q, setQ] = useState("");
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  /* crear artículo */
  const [f, setF] = useState({
    nombre: "",
    categoria: "Ropa de cama",
    unidad: "unidad",
    talla: "",
    color: "",
    estado: "NUEVO",       // NUEVO | USADO
    ubicacion: "",
    minStock: 0
  });

  /* movimiento */
  const [mov, setMov] = useState({
    cantidad: "",
    tipo: "INGRESO",       // INGRESO | EGRESO | AJUSTE
    motivo: "",
    referencia: ""
  });
  const [sel, setSel] = useState(null);

  /* cargar */
  const cargar = async () => {
    setLoading(true); setErr("");
    try {
      const { data } = await api.get("/bodega/items", { params: { q } });
      setLista(data?.items || data || []); // por si tu backend devuelve array directo
    } catch (e) {
      setErr(e?.response?.data?.message || "Error al cargar bodega");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { cargar(); }, []);

  /* crear */
  const crear = async (ev) => {
    ev.preventDefault(); setErr(""); setMsg("");
    try {
      const body = {
        ...f,
        minStock: Number(f.minStock || 0),
      };
      await api.post("/bodega/items", body);
      setMsg("Artículo agregado a bodega");
      setF({
        nombre:"", categoria:"Ropa de cama", unidad:"unidad",
        talla:"", color:"", estado:"NUEVO", ubicacion:"", minStock:0
      });
      cargar();
    } catch (e) {
      setErr(e?.response?.data?.message || "No se pudo crear el artículo");
    }
  };

  /* aplicar movimiento */
  const aplicarMov = async (ev) => {
    ev.preventDefault(); if (!sel) return;
    setErr(""); setMsg("");
    try {
      const body = {
        ...mov,
        cantidad: Number(mov.cantidad || 0),
      };
      await api.post(`/bodega/items/${sel.id}/movimientos`, body);
      setMsg("Movimiento aplicado");
      setMov({ cantidad: "", tipo: "INGRESO", motivo: "", referencia: "" });
      setSel(null);
      cargar();
    } catch (e) {
      setErr(e?.response?.data?.message || "No se pudo aplicar el movimiento");
    }
  };

  /* KPIs */
  const kpi = useMemo(() => {
    const totalItems = lista.length;
    const totalStock = lista.reduce((s, x) => s + Number(x.stock || 0), 0);
    const low = lista.filter(x => Number(x.stock) <= Number(x.min_stock || 0)).length;
    const nuevos = lista.filter(x => (x.estado || "").toUpperCase() === "NUEVO").length;
    const usados = lista.filter(x => (x.estado || "").toUpperCase() === "USADO").length;
    return { totalItems, totalStock, low, nuevos, usados };
  }, [lista]);

  return (
    <div className="container section">
      {/* Header */}
      <div className="panel" style={{ padding: 16 }}>
        <div className="toolbar" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h1 className="h1">Bodega</h1>
          <div className="toolbar" style={{ gap: 8, flexWrap: "wrap" }}>
            <input
              className="input"
              placeholder="Buscar (nombre, categoría, ubicación, talla, color)…"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              style={{ minWidth: 300 }}
            />
            <button className="btn btn-outline" onClick={cargar} disabled={loading}>Buscar</button>

            <a
              href={`${api.defaults.baseURL}/bodega/export.csv?q=${encodeURIComponent(q)}`}
              target="_blank" rel="noreferrer">
              <button type="button" className="btn btn-ghost">⬇️ CSV</button>
            </a>
            <button type="button" className="btn btn-ghost" onClick={()=>printHTML(lista)}>🖨️ Imprimir</button>
          </div>
        </div>

        {/* KPIs */}
        <div className="toolbar" style={{ marginTop: 10 }}>
          <div className="kpi kpi-total"><div>Total artículos</div><div>{kpi.totalItems}</div></div>
          <div className="kpi kpi-ok"><div>Stock total</div><div>{kpi.totalStock}</div></div>
          <div className="kpi kpi-warn"><div>Nuevos</div><div>{kpi.nuevos}</div></div>
          <div className="kpi kpi-info"><div>Usados</div><div>{kpi.usados}</div></div>
          <div className="kpi kpi-danger"><div>Bajo stock</div><div>{kpi.low}</div></div>
          {msg && <span className="badge badge-success">✔ {msg}</span>}
          {err && <span className="badge badge-warning">⚠ {err}</span>}
        </div>
      </div>

      {/* Formularios */}
      <div className="grid-2" style={{ gap: 16, marginTop: 12 }}>
        {/* Crear */}
        <form onSubmit={crear} className="card elevate">
          <div className="toolbar" style={{ justifyContent: "space-between" }}>
            <div className="h2">Agregar a bodega</div>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>

          <div className="form-grid cols-3" style={{ marginTop: 12 }}>
            <div>
              <label className="label">Nombre*</label>
              <input className="input" required
                     placeholder="Sábana / Almohada / Toalla…"
                     value={f.nombre} onChange={e=>setF({...f, nombre:e.target.value})}/>
            </div>
            <div>
              <label className="label">Categoría</label>
              <input className="input"
                     placeholder="Ropa de cama, Limpieza…"
                     value={f.categoria} onChange={e=>setF({...f, categoria:e.target.value})}/>
            </div>
            <div>
              <label className="label">Unidad</label>
              <input className="input"
                     placeholder="unidad, paquete, caja…"
                     value={f.unidad} onChange={e=>setF({...f, unidad:e.target.value})}/>
            </div>

            <div>
              <label className="label">Talla</label>
              <input className="input"
                     placeholder="S, M, L, 1.5 plz…"
                     value={f.talla} onChange={e=>setF({...f, talla:e.target.value})}/>
            </div>
            <div>
              <label className="label">Color</label>
              <input className="input"
                     value={f.color} onChange={e=>setF({...f, color:e.target.value})}/>
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="select"
                      value={f.estado} onChange={e=>setF({...f, estado:e.target.value})}>
                <option value="NUEVO">NUEVO</option>
                <option value="USADO">USADO</option>
              </select>
            </div>

            <div>
              <label className="label">Ubicación</label>
              <input className="input"
                     placeholder="Estante/Área"
                     value={f.ubicacion} onChange={e=>setF({...f, ubicacion:e.target.value})}/>
            </div>
            <div>
              <label className="label">Stock mínimo</label>
              <input className="input" type="number" min={0}
                     value={f.minStock}
                     onChange={e=>setF({...f, minStock: parseInt(e.target.value || "0")})}/>
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
              <label className="label">Artículo</label>
              <select className="select"
                value={sel?.id || ""}
                onChange={e=>setSel(lista.find(x=>String(x.id)===e.target.value) || null)}>
                <option value="">Selecciona un artículo</option>
                {lista.map(it=> (
                  <option key={it.id} value={it.id}>{it.nombre} — stock {it.stock}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tipo</label>
              <select className="select"
                value={mov.tipo} onChange={e=>setMov({...mov, tipo:e.target.value})}>
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
              <input className="input"
                     value={mov.motivo}
                     onChange={e=>setMov({...mov, motivo:e.target.value})}/>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label">Referencia (OC / Factura / Nota)</label>
              <input className="input"
                     value={mov.referencia}
                     onChange={e=>setMov({...mov, referencia:e.target.value})}/>
            </div>
          </div>
        </form>
      </div>

      {/* Tabla */}
      <div className="panel" style={{ padding: 0, marginTop: 16 }}>
        <div style={{ padding: 12, borderBottom: "1px solid var(--lv-border)" }}>
          <div className="h2">Artículos en bodega</div>
        </div>
        <div style={{ overflow: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th><th>Categoría</th><th>Unidad</th>
                <th>Talla</th><th>Color</th><th>Estado</th>
                <th>Stock</th><th>Mín</th><th>Ubicación</th>
                <th>Alertas</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(it => {
                const low = Number(it.stock) <= Number(it.min_stock || 0);
                const est = String(it.estado || "").toUpperCase();
                return (
                  <tr key={it.id} style={{ background: low ? "rgba(239,68,68,.06)" : "transparent" }}>
                    <td style={{ fontWeight: 800 }}>{it.nombre}</td>
                    <td>{it.categoria || "—"}</td>
                    <td>{it.unidad || "—"}</td>
                    <td>{it.talla || "—"}</td>
                    <td>{it.color || "—"}</td>
                    <td>
                      {est === "NUEVO" ? (
                        <span className="badge" style={{ background:"rgba(16,185,129,.15)", borderColor:"rgba(16,185,129,.35)", color:"#065f46" }}>Nuevo</span>
                      ) : (
                        <span className="badge" style={{ background:"rgba(59,130,246,.15)", borderColor:"rgba(59,130,246,.35)", color:"#1d4ed8" }}>Usado</span>
                      )}
                    </td>
                    <td>{it.stock}</td>
                    <td>{it.min_stock}</td>
                    <td>{it.ubicacion || "—"}</td>
                    <td>
                      {low ? <span className="badge badge-warning">Bajo stock</span> : <span className="muted">—</span>}
                    </td>
                  </tr>
                );
              })}
              {!loading && lista.length === 0 && (
                <tr><td colSpan={10} className="muted">Sin resultados</td></tr>
              )}
              {loading && (
                <tr><td colSpan={10} className="muted">Cargando…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
