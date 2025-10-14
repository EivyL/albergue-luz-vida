import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api from "../api";

/* ---------- mini UI helpers ---------- */
const Card = ({ title, right, children, style }) => (
  <div className="card" style={{ padding: 12, ...style }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
      }}
    >
      <div style={{ color: "var(--lv-text-muted)", fontWeight: 700 }}>{title}</div>
      {right}
    </div>
    {children}
  </div>
);

const KPI = ({ label, value, sub }) => (
  <div
    className="panel"
    style={{ padding: 14, background: "#fff", borderRadius: 12, textAlign: "center" }}
  >
    <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: "#0b4daa" }}>
      {value}
    </div>
    {sub ? (
      <div style={{ color: "#94a3b8", marginTop: 4, fontSize: 12 }}>{sub}</div>
    ) : null}
  </div>
);

/* ---------- main component ---------- */
export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      setErr("");
      try {
        const { data } = await api.get("/stats/overview");
        setStats(data);
      } catch (e) {
        setErr(e?.response?.data?.message || "No se pudo cargar el resumen");
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const k = stats?.kpis || {};
  const libresPct = k.camas_totales
    ? Math.round((Number(k.camas_libres || 0) / Number(k.camas_totales || 0)) * 100)
    : 0;

  // Datos de ocupación (área chart)
  const ocupacion7d = useMemo(() => {
    const arr = stats?.charts?.ocupacion7d || [];
    return arr.map((r) => ({
      fecha: new Date(r.fecha).toLocaleDateString(),
      ocupadas: Number(r.ocupadas || 0),
      libres: Math.max(0, Number(r.totales || 0) - Number(r.ocupadas || 0)),
    }));
  }, [stats]);

  // Datos de cocina (bar chart)
  const cocinaSemanal = useMemo(() => {
    const arr = stats?.charts?.cocinaSemanal || [
      { dia: "Lun", comidas: 120 },
      { dia: "Mar", comidas: 140 },
      { dia: "Mié", comidas: 135 },
      { dia: "Jue", comidas: 155 },
      { dia: "Vie", comidas: 170 },
      { dia: "Sáb", comidas: 160 },
      { dia: "Dom", comidas: 130 },
    ];
    return arr;
  }, [stats]);

  // Distribución de insumos (pie chart)
  const insumosCocina = useMemo(() => {
    const arr = stats?.charts?.insumosCocina || [
      { nombre: "Granos", cantidad: 35 },
      { nombre: "Verduras", cantidad: 25 },
      { nombre: "Carnes", cantidad: 20 },
      { nombre: "Lácteos", cantidad: 10 },
      { nombre: "Otros", cantidad: 10 },
    ];
    return arr;
  }, [stats]);

  const COLORS = ["#0b4daa", "#c91d1d", "#0ea5e9", "#f59e0b", "#10b981"];

  return (
    <div
      className="container"
      style={{
        display: "grid",
        gap: 20,
        paddingTop: 16,
        background: "linear-gradient(to bottom, #f8fafc, #ffffff)",
      }}
    >
      {/* ---------------- HERO ---------------- */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 20,
          padding: "96px 24px 80px",
          textAlign: "center",
          background:
            "radial-gradient(1100px 500px at 50% -20%, rgba(11,77,170,.10), transparent 60%), linear-gradient(180deg, #ffffff, #f7fafc)",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(transparent 23px, rgba(11,77,170,.06) 24px), linear-gradient(90deg, transparent 23px, rgba(11,77,170,.06) 24px)",
            backgroundSize: "24px 24px",
            maskImage:
              "linear-gradient(to bottom, transparent, black 25%, black 75%, transparent)",
            pointerEvents: "none",
          }}
        />

        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            top: 92,
            transform: "translateX(-50%)",
            width: 360,
            height: 360,
            borderRadius: "50%",
            filter: "blur(8px)",
            opacity: 0.6,
            background:
              "conic-gradient(from 0deg, rgba(11,77,170,.18), rgba(201,29,29,.18), rgba(11,77,170,.18))",
            animation: "spin 18s linear infinite",
          }}
        />

        <div
          style={{
            display: "inline-grid",
            placeItems: "center",
            gap: 12,
            padding: 18,
            marginBottom: 14,
            borderRadius: 24,
            background: "rgba(255,255,255,.55)",
            boxShadow:
              "0 10px 30px rgba(0,0,0,.08), inset 0 0 0 1px rgba(255,255,255,.6)",
            backdropFilter: "blur(6px)",
          }}
        >
          <img
            src="/images/luz.png"
            alt="Logo Albergue Luz y Vida"
            style={{
              width: 156,
              height: 156,
              borderRadius: "50%",
              objectFit: "contain",
              background: "#fff",
              boxShadow: "0 6px 24px rgba(0,0,0,.10)",
            }}
          />
        </div>

        <h1
          style={{
            margin: "0 0 6px",
            fontSize: "clamp(28px, 4.4vw, 46px)",
            fontWeight: 900,
            color: "#000000",
          }}
        >
          ALBERGUE CASA DE MISERICORDIA
        </h1>

        <div
          style={{
            fontSize: "clamp(18px, 2.6vw, 26px)",
            fontWeight: 800,
            color: "#c91d1d",
            marginBottom: 12,
          }}
        >
          “LUZ Y VIDA”
        </div>

        <p
          style={{
            color: "#475569",
            fontSize: "clamp(14px, 1.6vw, 18px)",
            maxWidth: 760,
            margin: "0 auto",
            lineHeight: 1.65,
          }}
        >
          “Les aseguro que todo lo que hicieron por uno de mis hermanos, aun por el más
          pequeño, lo hicieron por mí.” <br />
          <span style={{ fontWeight: 600 }}>Mateo 25:40</span>
        </p>

        <div
          aria-hidden
          style={{
            height: 3,
            width: 160,
            margin: "18px auto 0",
            borderRadius: 999,
            background:
              "linear-gradient(90deg, rgba(11,77,170,.9), rgba(201,29,29,.9))",
            boxShadow: "0 2px 10px rgba(11,77,170,.25)",
          }}
        />

        <style>{`
          @keyframes spin { 
            to { transform: translateX(-50%) rotate(360deg); } 
          }
        `}</style>
      </section>

      {/* ---------------- KPIs ---------------- */}
      <section
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        <KPI
          label="Ocupación actual"
          value={`${Number(k.camas_ocupadas || 0)} / ${Number(
            k.camas_totales || 0
          )}`}
          sub={`Libres: ${Number(k.camas_libres || 0)} (${libresPct}%)`}
        />
        <KPI label="Beneficiarios activos" value={Number(k.beneficiarios_activos || 0)} />
        <KPI label="Usuarios activos" value={Number(k.usuarios_activos || 0)} />
        <KPI
          label="Comidas servidas (hoy)"
          value={`${Number(k.comidas_hoy || 0).toLocaleString()}`}
          sub="Raciones preparadas en cocina"
        />
      </section>

      {/* ---------------- GRÁFICOS ---------------- */}
      <section
        style={{
          display: "grid",
          gap: 14,
          gridTemplateColumns: "1.2fr 1fr",
        }}
      >
        <Card
          title="Ocupación — últimos 7 días"
          right={
            <button className="btn btn-ghost" onClick={() => navigate("/estadisticas")}>
              Ver más
            </button>
          }
        >
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ocupacion7d}>
                <XAxis dataKey="fecha" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="ocupadas"
                  stroke="#0b4daa"
                  fill="#0b4daa"
                  fillOpacity={0.25}
                />
                <Area
                  type="monotone"
                  dataKey="libres"
                  stroke="#c91d1d"
                  fill="#c91d1d"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* --- Nuevo gráfico de cocina --- */}
        <Card title="Cocina — raciones servidas semanalmente">
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cocinaSemanal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip formatter={(v) => `${v} raciones`} />
                <Bar dataKey="comidas" fill="#c91d1d" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* ---------------- INSUMOS PIE ---------------- */}
      <section>
        <Card title="Distribución de insumos — cocina">
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={insumosCocina}
                  dataKey="cantidad"
                  nameKey="nombre"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {insumosCocina.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v} unidades`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>
    </div>
  );
}
