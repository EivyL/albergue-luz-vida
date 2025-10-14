// frontend/src/screens/Estadisticas.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../api";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid
} from "recharts";

/* ---------- UI helpers (alineados a theme.css) ---------- */
const Panel = ({ title, right, children, style }) => (
  <div className="panel" style={{ padding: 16, ...style }}>
    <div className="toolbar" style={{ justifyContent: "space-between", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
      {title ? <div className="h2">{title}</div> : <span />}
      {right}
    </div>
    {children}
  </div>
);

const KPI = ({ label, value, tone = "kpi-ok", hint }) => (
  <div className={`kpi ${tone}`}>
    <div>{label}</div>
    <div>{value}</div>
    {hint ? <small className="muted" style={{ display: "block", marginTop: 4 }}>{hint}</small> : null}
  </div>
);

const Card = ({ title, children, right }) => (
  <div className="card">
    <div className="toolbar" style={{ justifyContent: "space-between", marginBottom: 8 }}>
      <div className="h3">{title}</div>
      {right}
    </div>
    {children}
  </div>
);

/* ---------- Hook: leer colores del tema ---------- */
function useThemeColors() {
  const [vars, setVars] = useState({
    primary: "#14b8a6",
    info: "#38bdf8",
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
    text: "#e5e7eb",
    border: "#1f2937",
  });

  useEffect(() => {
    const el = document.documentElement;
    const get = (name, fallback) =>
      getComputedStyle(el).getPropertyValue(name)?.trim() || fallback;
    setVars({
      primary: get("--lv-primary", vars.primary),
      info: get("--lv-info", vars.info),
      success: get("--lv-success", vars.success),
      warning: get("--lv-warning", vars.warning),
      danger: get("--lv-danger", vars.danger),
      text: get("--lv-text", vars.text),
      border: get("--lv-border", vars.border),
    });
    // actualizar si cambia el data-theme
    const obs = new MutationObserver(() => {
      setVars({
        primary: get("--lv-primary", vars.primary),
        info: get("--lv-info", vars.info),
        success: get("--lv-success", vars.success),
        warning: get("--lv-warning", vars.warning),
        danger: get("--lv-danger", vars.danger),
        text: get("--lv-text", vars.text),
        border: get("--lv-border", vars.border),
      });
    });
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
    // eslint-disable-next-line
  }, []);

  return vars;
}

/* ---------- Component ---------- */
export default function Estadisticas() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const colors = useThemeColors();

  const cargar = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/stats/overview"); // asegúrate del prefijo / (consistente con otros módulos)
      setData(data || {});
    } catch (e) {
      console.error(e);
      setData({ kpis: {}, charts: { ocupacion7d: [], compras6m: [] }, tables: { inventarioBajoTop: [] } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const k = data?.kpis || {};
  const charts = data?.charts || {};
  const tables = data?.tables || {};
  const ocupacion7d = Array.isArray(charts.ocupacion7d) ? charts.ocupacion7d : [];
  const compras6m = Array.isArray(charts.compras6m) ? charts.compras6m : [];
  const inventarioTop = Array.isArray(tables.inventarioBajoTop) ? tables.inventarioBajoTop : [];

  const libresPct = useMemo(() => {
    const tot = Number(k.camas_totales || 0);
    const libres = Number(k.camas_libres || 0);
    return tot ? Math.round((libres / tot) * 100) : 0;
  }, [k]);

  /* dataset formateado para charts */
  const areaData = useMemo(() => {
    return ocupacion7d.map((r) => ({
      fecha: new Date(r.fecha).toLocaleDateString(),
      ocupadas: Number(r.ocupadas || 0),
      libres: Math.max(0, Number(r.totales || 0) - Number(r.ocupadas || 0)),
    }));
  }, [ocupacion7d]);

  const barData = useMemo(() => {
    return compras6m.map((r) => ({
      mes: r.mes,
      monto: Number(r.monto || 0),
    }));
  }, [compras6m]);

  if (loading) {
    return (
      <div className="container section">
        <div className="panel">
          <div className="toolbar" style={{ gap: 8 }}>
            <div className="spinner" />
            Cargando…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container section" style={{ display: "grid", gap: 12 }}>
      {/* KPIs */}
      <Panel
        title="Resumen del albergue"
        right={
          <div className="toolbar" style={{ gap: 8 }}>
            <button className="btn btn-ghost" onClick={cargar}>Actualizar</button>
          </div>
        }
      >
        <div className="kpi-grid">
          <KPI
            label="Ocupación actual"
            value={`${Number(k.camas_ocupadas || 0)} / ${Number(k.camas_totales || 0)}`}
            tone="kpi-info"
            hint={`Libres: ${k.camas_libres || 0} (${libresPct}%)`}
          />
          <KPI label="Beneficiarios activos" value={Number(k.beneficiarios_activos || 0)} tone="kpi-ok" />
          <KPI label="Usuarios activos" value={Number(k.usuarios_activos || 0)} tone="kpi-ok" />
          <KPI label="Inventario bajo" value={Number(k.inventario_bajo || 0)} tone="kpi-warn" />
          <KPI
            label="Compras (mes)"
            value={`Q ${Number(k.compras_monto_mes || 0).toLocaleString()}`}
            tone="kpi-info"
            hint={`${Number(k.compras_ordenes_mes || 0)} orden(es)`}
          />
        </div>
      </Panel>

      {/* Charts */}
      <div className="grid grid-2" style={{ gap: 12 }}>
        <Card title="Ocupación últimos 7 días">
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="gradOcup" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.info} stopOpacity={0.45} />
                    <stop offset="95%" stopColor={colors.info} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradLibres" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.success} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={colors.success} stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={colors.border} strokeDasharray="3 3" />
                <XAxis dataKey="fecha" stroke={colors.text} />
                <YAxis allowDecimals={false} stroke={colors.text} />
                <Tooltip
                  contentStyle={{ background: "var(--lv-panel)", border: `1px solid ${colors.border}`, color: "var(--lv-text)" }}
                  labelStyle={{ color: "var(--lv-text-muted)" }}
                />
                <Area type="monotone" dataKey="ocupadas" stroke={colors.info} fill="url(#gradOcup)" />
                <Area type="monotone" dataKey="libres" stroke={colors.success} fill="url(#gradLibres)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Compras últimos 6 meses">
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid stroke={colors.border} strokeDasharray="3 3" />
                <XAxis dataKey="mes" stroke={colors.text} />
                <YAxis stroke={colors.text} tickFormatter={(v) => `Q ${Math.round(v / 1000)}k`} />
                <Tooltip
                  formatter={(v) => `Q ${Number(v).toLocaleString()}`}
                  contentStyle={{ background: "var(--lv-panel)", border: `1px solid ${colors.border}`, color: "var(--lv-text)" }}
                  labelStyle={{ color: "var(--lv-text-muted)" }}
                />
                <Bar dataKey="monto" fill={colors.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Tabla: Inventario bajo */}
      <Card title="Top inventario bajo">
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Ítem</th>
                <th style={{ textAlign: "right" }}>Stock</th>
                <th style={{ textAlign: "right" }}>Mínimo</th>
              </tr>
            </thead>
            <tbody>
              {inventarioTop.map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{row.item}</td>
                  <td style={{ textAlign: "right" }}>{row.stock}</td>
                  <td style={{ textAlign: "right" }}>{row.stock_minimo}</td>
                </tr>
              ))}
              {inventarioTop.length === 0 && (
                <tr>
                  <td colSpan={3} className="muted">Sin ítems bajo mínimo</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ====== estilos mínimos responsivos (si no los tienes ya) ======
   Puedes mover esto a tu theme.css si prefieres.
*/
const injectOnce = (id, css) => {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id;
  el.innerHTML = css;
  document.head.appendChild(el);
};

injectOnce(
  "stats-local-css",
  `
  .grid{display:grid}
  .grid-2{grid-template-columns:1.2fr 1fr}
  @media (max-width: 980px){ .grid-2{grid-template-columns:1fr} }

  .kpi-grid{
    display:grid; gap:12px;
    grid-template-columns: repeat(auto-fit, minmax(200px,1fr));
  }
  .kpi{ border:1px solid var(--lv-border); border-radius:12px; padding:12px; background:var(--lv-panelev); }
  .kpi > div:first-child{ color:var(--lv-text-muted); font-weight:600; }
  .kpi > div:nth-child(2){ font-size:26px; font-weight:800; line-height:1.1; margin-top:4px; }

  .kpi-ok{ box-shadow: 0 0 0 1px rgba(16,185,129,.08) inset; }
  .kpi-info{ box-shadow: 0 0 0 1px rgba(59,130,246,.08) inset; }
  .kpi-warn{ box-shadow: 0 0 0 1px rgba(234,179,8,.12) inset; }
  .kpi-danger{ box-shadow: 0 0 0 1px rgba(239,68,68,.12) inset; }

  .h1{ font-size:1.6rem; font-weight:800 }
  .h2{ font-size:1.1rem; font-weight:800 }
  .h3{ font-size:1rem; font-weight:700 }
`
);
