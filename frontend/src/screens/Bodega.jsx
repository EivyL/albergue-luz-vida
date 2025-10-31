// frontend/src/screens/Bodega.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../api";

/* ==========================
   Helpers y estilos inline
   ========================== */
const printHTML = (rows) => {
  const html = `
<!doctype html><html>
<head><meta charset="utf-8"/><title>Listado — Bodega</title>
<style>
  :root{ --ink:#0f172a; --muted:#6b7280; --line:#e5e7eb; --bg:#ffffff; }
  *{ box-sizing: border-box }
  body{ font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin:24px; color:var(--ink); background:var(--bg); }
  h1{ margin:0 0 6px 0; font-size:18px }
  .sub{ color:var(--muted); font-size:12px; }
  table{ width:100%; border-collapse:collapse; font-size:12px; margin-top:8px }
  th,td{ padding:10px 12px; border-bottom:1px solid var(--line); text-align:left; }
  th{ background:#f8fafc; position:sticky; top:0; z-index:1 }
  tr:nth-child(even){ background:#fafafa }
  .num{ text-align:right }
</style>
</head>
<body>
  <h1>Listado — Bodega</h1>
  <div class="sub">Generado: ${new Date().toLocaleDateString()}</div>
  <table>
    <thead><tr>
      <th>Nombre</th><th>Categoría</th><th>Unidad</th>
      <th>Talla</th><th>Color</th><th>Estado</th>
      <th class="num">Stock</th><th class="num">Mín</th><th>Ubicación</th>
    </tr></thead>
    <tbody>
      ${rows.map(it => `
        <tr>
          <td>${it.nombre || ""}</td>
          <td>${it.categoria || "—"}</td>
          <td>${it.unidad || "—"}</td>
          <td>${it.talla || "—"}</td>
          <td>${it.color || "—"}</td>
          <td>${it.estado || "—"}</td>
          <td class="num">${it.stock ?? ""}</td>
          <td class="num">${it.min_stock ?? ""}</td>
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

const styles = {
  card: {
    background: "#fff",
    border: "1px solid var(--lv-border, #e5e7eb)",
    borderRadius: 12,
    boxShadow: "0 1px 2px rgba(16,24,40,.04)",
  },
  headerBar: {
    padding: 16,
    borderBottom: "1px solid var(--lv-border, #e5e7eb)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  kpi: {
    border: "1px solid var(--lv-border, #e5e7eb)",
    borderRadius: 12,
    padding: "10px 12px",
    minWidth: 160,
    display: "grid",
    gridTemplateRows: "auto auto",
    gap: 4,
    background: "#fff",
  },
  kpiTitle: { fontSize: 12, color: "#64748b", fontWeight: 600 },
  kpiValue: { fontSize: 20, fontWeight: 800, letterSpacing: ".2px" },
  tableHeadCell: { whiteSpace: "nowrap", fontSize: 12, color: "#334155", textTransform: "uppercase", letterSpacing: ".04em" },
  badge: {
    borderRadius: 999,
    border: "1px solid",
    fontSize: 12,
    padding: "2px 8px",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
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
      setLista(data?.items || data || []);
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
      const body = { ...f, minStock: Number(f.minStock || 0) };
      await api.post("/bodega/items", body);
      setMsg("Artículo agregado a bodega");
      setF({ nombre:"", categoria:"Ropa de cama", unidad:"unidad", talla:"", color:"", estado:"NUEVO", ubicacion:"", minStock:0 });
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
      const body = { ...mov, cantidad: Number(mov.cantidad || 0) };
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

  const lowBg = (flag) => flag ? "rgba(239,68,68,.05)" : "transparent";

  return (
    <div className="container section" style={{ maxWidth: 1200, marginInline: "auto" }}>
      {/* ===== Header ===== */}
      <div className="panel" style={{ ...styles.card, padding: 0 }}>
        <div style={styles.headerBar}>
          <div>
            <h1 className="h1" style={{ margin: 0 }}>Bodega</h1>
            <div className="muted" style={{ fontSize: 12 }}>Gestión de artículos y movimientos</div>
          </div>
          <div className="toolbar" style={{ gap: 8, flexWrap: "wrap" }}>
            <input
              className="input"
              placeholder="Buscar (nombre, categoría, ubicación, talla, color)…"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              aria-label="Buscar en bodega"
              style={{ minWidth: 320 }}
            />
            <button className="btn btn-outline" onClick={cargar} disabled={loading} aria-label="Buscar">{loading ? "Buscando…" : "Buscar"}</button>
            <a href={`${api.defaults.baseURL}/bodega/export.csv?q=${encodeURIComponent(q)}`} target="_blank" rel="noreferrer">
              <button type="button" className="btn btn-ghost" aria-label="Exportar CSV">⬇️ CSV</button>
            </a>
            <button type="button" className="btn btn-ghost" onClick={()=>printHTML(lista)} aria-label="Imprimir">🖨️ Imprimir</button>
          </div>
        </div>

        {/* ===== KPIs ===== */}
        <div className="toolbar" style={{ padding: 12, gap: 12, flexWrap: "wrap" }}>
          <div style={styles.kpi} aria-label="Total artículos">
            <div style={styles.kpiTitle}>Total artículos</div>
            <div style={styles.kpiValue}>{kpi.totalItems}</div>
          </div>
          <div style={styles.kpi} aria-label="Stock total">
            <div style={styles.kpiTitle}>Stock total</div>
            <div style={styles.kpiValue}>{kpi.totalStock}</div>
          </div>
          <div style={styles.kpi} aria-label="Nuevos">
            <div style={styles.kpiTitle}>Nuevos</div>
            <div style={styles.kpiValue}>{kpi.nuevos}</div>
          </div>
          <div style={styles.kpi} aria-label="Usados">
            <div style={styles.kpiTitle}>Usados</div>
            <div style={styles.kpiValue}>{kpi.usados}</div>
          </div>
          <div style={styles.kpi} aria-label="Bajo stock">
            <div style={styles.kpiTitle}>Bajo stock</div>
            <div style={{...styles.kpiValue, color: kpi.low ? "#b45309" : "#0f766e"}}>{kpi.low}</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {msg && <span className="badge badge-success" role="status" aria-live="polite">✔ {msg}</span>}
            {err && <span className="badge badge-warning" role="alert">⚠ {err}</span>}
          </div>
        </div>
      </div>

      {/* ===== Formularios ===== */}
      <div className="grid-2" style={{ gap: 16, marginTop: 12 }}>
        {/* Crear */}
        <form onSubmit={crear} className="card elevate" style={styles.card}>
          <div style={styles.headerBar}>
            <div className="h2" style={{ margin: 0 }}>Agregar a bodega</div>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>

          <div className="form-grid cols-3" style={{ padding: 16, rowGap: 12 }}>
            <div>
              <label className="label" htmlFor="f-nombre">Nombre*</label>
              <input id="f-nombre" className="input" required placeholder="Sábana / Almohada / Toalla…" value={f.nombre} onChange={e=>setF({...f, nombre:e.target.value})}/>
            </div>
            <div>
              <label className="label" htmlFor="f-categoria">Categoría</label>
              <input id="f-categoria" className="input" placeholder="Ropa de cama, Limpieza…" value={f.categoria} onChange={e=>setF({...f, categoria:e.target.value})}/>
            </div>
            <div>
              <label className="label" htmlFor="f-unidad">Unidad</label>
              <input id="f-unidad" className="input" placeholder="unidad, paquete, caja…" value={f.unidad} onChange={e=>setF({...f, unidad:e.target.value})}/>
            </div>

            <div>
              <label className="label" htmlFor="f-talla">Talla</label>
              <input id="f-talla" className="input" placeholder="S, M, L, 1.5 plz…" value={f.talla} onChange={e=>setF({...f, talla:e.target.value})}/>
            </div>
            <div>
              <label className="label" htmlFor="f-color">Color</label>
              <input id="f-color" className="input" value={f.color} onChange={e=>setF({...f, color:e.target.value})}/>
            </div>
            <div>
              <label className="label" htmlFor="f-estado">Estado</label>
              <select id="f-estado" className="select" value={f.estado} onChange={e=>setF({...f, estado:e.target.value})}>
                <option value="NUEVO">NUEVO</option>
                <option value="USADO">USADO</option>
              </select>
            </div>

            <div>
              <label className="label" htmlFor="f-ubicacion">Ubicación</label>
              <input id="f-ubicacion" className="input" placeholder="Estante/Área" value={f.ubicacion} onChange={e=>setF({...f, ubicacion:e.target.value})}/>
            </div>
            <div>
              <label className="label" htmlFor="f-min">Stock mínimo</label>
              <input id="f-min" className="input" type="number" min={0} value={f.minStock} onChange={e=>setF({...f, minStock: parseInt(e.target.value || "0")})}/>
            </div>
          </div>
        </form>

        {/* Movimiento */}
        <form onSubmit={aplicarMov} className="card elevate" style={styles.card}>
          <div style={styles.headerBar}>
            <div className="h2" style={{ margin: 0 }}>Movimiento</div>
            <button type="submit" className="btn btn-primary" disabled={!sel || !mov.cantidad || Number(mov.cantidad) <= 0}>Aplicar</button>
          </div>

          <div className="form-grid cols-2" style={{ padding: 16, rowGap: 12 }}>
            <div>
              <label className="label" htmlFor="m-articulo">Artículo</label>
              <select id="m-articulo" className="select" value={sel?.id || ""} onChange={e=>setSel(lista.find(x=>String(x.id)===e.target.value) || null)}>
                <option value="">Selecciona un artículo</option>
                {lista.map(it=> (
                  <option key={it.id} value={it.id}>{it.nombre} — stock {it.stock}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="m-tipo">Tipo</label>
              <select id="m-tipo" className="select" value={mov.tipo} onChange={e=>setMov({...mov, tipo:e.target.value})}>
                <option>INGRESO</option>
                <option>EGRESO</option>
                <option>AJUSTE</option>
              </select>
            </div>

            <div>
              <label className="label" htmlFor="m-cantidad">Cantidad</label>
              <input id="m-cantidad" className="input" type="number" min={1} value={mov.cantidad} onChange={e=>setMov({...mov, cantidad: e.target.value})}/>
            </div>
            <div>
              <label className="label" htmlFor="m-motivo">Motivo</label>
              <input id="m-motivo" className="input" value={mov.motivo} onChange={e=>setMov({...mov, motivo:e.target.value})}/>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label" htmlFor="m-ref">Referencia (OC / Factura / Nota)</label>
              <input id="m-ref" className="input" value={mov.referencia} onChange={e=>setMov({...mov, referencia:e.target.value})}/>
            </div>
          </div>
        </form>
      </div>

      {/* ===== Tabla ===== */}
      <div className="panel" style={{ ...styles.card, padding: 0, marginTop: 16 }}>
        <div style={{ ...styles.headerBar, borderBottom: "1px solid var(--lv-border, #e5e7eb)" }}>
          <div className="h2" style={{ margin: 0 }}>Artículos en bodega</div>
        </div>
        <div style={{ overflow: "auto" }}>
          <table className="table" role="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 1, borderBottom: "1px solid #e5e7eb" }}>
              <tr>
                <th style={styles.tableHeadCell}>Nombre</th>
                <th style={styles.tableHeadCell}>Categoría</th>
                <th style={styles.tableHeadCell}>Unidad</th>
                <th style={styles.tableHeadCell}>Talla</th>
                <th style={styles.tableHeadCell}>Color</th>
                <th style={styles.tableHeadCell}>Estado</th>
                <th style={{...styles.tableHeadCell, textAlign:'right'}}>Stock</th>
                <th style={{...styles.tableHeadCell, textAlign:'right'}}>Mín</th>
                <th style={styles.tableHeadCell}>Ubicación</th>
                <th style={styles.tableHeadCell}>Alertas</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(it => {
                const low = Number(it.stock) <= Number(it.min_stock || 0);
                const est = String(it.estado || "").toUpperCase();
                return (
                  <tr key={it.id} style={{ background: lowBg(low) }}>
                    <td style={{ fontWeight: 700 }}>{it.nombre}</td>
                    <td>{it.categoria || "—"}</td>
                    <td>{it.unidad || "—"}</td>
                    <td>{it.talla || "—"}</td>
                    <td>{it.color || "—"}</td>
                    <td>
                      {est === "NUEVO" ? (
                        <span className="badge" style={{ ...styles.badge, background:"rgba(16,185,129,.10)", borderColor:"rgba(16,185,129,.35)", color:"#065f46" }}>● Nuevo</span>
                      ) : (
                        <span className="badge" style={{ ...styles.badge, background:"rgba(59,130,246,.10)", borderColor:"rgba(59,130,246,.35)", color:"#1d4ed8" }}>● Usado</span>
                      )}
                    </td>
                    <td style={{ textAlign:'right' }}>{it.stock}</td>
                    <td style={{ textAlign:'right' }}>{it.min_stock}</td>
                    <td>{it.ubicacion || "—"}</td>
                    <td>
                      {low ? (
                        <span className="badge badge-warning" title="Este artículo está por debajo del stock mínimo">Bajo stock</span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && lista.length === 0 && (
                <tr>
                  <td colSpan={10} className="muted" style={{ textAlign:'center', padding: 24 }}>Sin resultados</td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={10} className="muted" style={{ textAlign:'center', padding: 24 }}>Cargando…</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
