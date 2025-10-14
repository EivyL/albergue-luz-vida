// src/screens/Habitaciones.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../api";

/* ---------- UI helpers minimal ---------- */
const Pill = ({ children, tone = "#eef2ff", fg = "#1e3a8a" }) => (
  <span style={{
    display:"inline-block", padding:"2px 8px", borderRadius:12,
    background:tone, color:fg, fontSize:12, fontWeight:700
  }}>{children}</span>
);

const Button = ({ children, tone="primary", ...rest }) => {
  const palette = {
    primary: { bg: "#2563eb", fg:"#fff", br:"#1e40af" },
    ghost:   { bg: "#f8fafc", fg:"#0f172a", br:"#e2e8f0" },
    soft:    { bg: "#eef2ff", fg:"#1e3a8a", br:"#c7d2fe" },
    danger:  { bg: "#fee2e2", fg:"#991b1b", br:"#fecaca" },
    gray:    { bg: "#f1f5f9", fg:"#0f172a", br:"#e2e8f0" },
  }[tone];
  return (
    <button {...rest} style={{
      padding:"10px 14px", borderRadius:10, fontWeight:700,
      border:`1px solid ${palette.br}`, background:palette.bg, color:palette.fg,
      cursor:"pointer", display:"inline-flex", alignItems:"center", gap:8
    }}>{children}</button>
  );
};

const Input = (p) => <input {...p} style={{
  ...p.style, padding:"10px 12px", borderRadius:10,
  border:"1px solid #d6dae1", background:"#fff", color:"#0f172a", outline:"none"
}}/>;
const Select = (p) => <select {...p} style={{
  ...p.style, padding:"10px 12px", borderRadius:10,
  border:"1px solid #d6dae1", background:"#fff", color:"#0f172a", outline:"none"
}}/>;

const fullName = (b = {}) =>
  [b.nombres ?? b.nombre ?? "", b.apellidos ?? b.apellido ?? ""].join(" ").trim() || (b.documento ?? "—");

const compLetter = (n) => {
  const i = Number(n) || 0;
  return String.fromCharCode(64 + Math.min(Math.max(i, 1), 26)); // 1->A, 2->B, 3->C …
};

/* Agrupa camas por litera -> {litera, plazas:[{id_cama, compartimiento, estado, beneficiario?}] } */
const groupByLitera = (camas = []) => {
  const map = new Map();
  for (const c of camas) {
    const key = c.litera ?? "—";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(c);
  }
  const out = Array.from(map.entries()).map(([litera, arr]) => ({
    litera,
    plazas: arr.sort((a,b)=> (a.compartimiento||0)-(b.compartimiento||0))
  }));
  // ordena por número si es numérico; cae a orden alfabético sino
  return out.sort((a,b)=> (Number(a.litera)||0) - (Number(b.litera)||0) || String(a.litera).localeCompare(String(b.litera)));
};

export default function Habitaciones() {
  /* Solo dos habitaciones: por sexo */
  const [sexo, setSexo] = useState("H");

  /* habitaciones y selección activa (en caso haya varias en backend) */
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState(null);

  /* camas de la habitación activa (en bruto + agrupadas por litera) */
  const [camas, setCamas] = useState([]);
  const literas = useMemo(()=> groupByLitera(camas), [camas]);

  /* acordión: litera abierta(s) */
  const [openKeys, setOpenKeys] = useState(() => new Set());
  const toggleOpen = (key) =>
    setOpenKeys((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  const expandAll   = () => setOpenKeys(new Set(literas.map(l => String(l.litera))));
  const collapseAll = () => setOpenKeys(new Set());

  /* asignador */
  const [picker, setPicker] = useState(null); // id_cama activa
  const [qBen, setQBen] = useState("");
  const [resBen, setResBen] = useState([]);
  const [buscando, setBuscando] = useState(false);

  /* generar */
  const [showGen, setShowGen] = useState(false);
  const [literasN, setLiterasN] = useState(2);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  /* === cargar habitaciones por sexo === */
  const cargarRooms = async () => {
    setLoading(true); setErr(""); setMsg("");
    try {
      const { data } = await api.get("/habitaciones", { params: { sexo } });
      const items = data?.items || [];
      setRooms(items);
      const chosen = items.find(r => r.id_habitacion === roomId)?.id_habitacion
                  ?? items[0]?.id_habitacion ?? null;
      setRoomId(chosen);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Error cargando habitaciones");
    } finally { setLoading(false); }
  };
  useEffect(()=>{ cargarRooms(); setCamas([]); setPicker(null); collapseAll(); }, [sexo]);

  /* === cargar camas de la habitación activa === */
  const cargarCamas = async (hid = roomId) => {
    if (!hid) { setCamas([]); collapseAll(); return; }
    try {
      const { data } = await api.get(`/habitaciones/${hid}/camas`);
      setCamas(data?.items || []);
      collapseAll(); // al cambiar de cuarto, empieza colapsado
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "No se pudieron cargar las camas");
    }
  };
  useEffect(()=>{ cargarCamas(roomId); setPicker(null); }, [roomId]);

  /* KPIs */
  const kpi = useMemo(()=>{
    const tot = camas.length;
    const ocup = camas.filter(c => c.estado === "OCUPADA").length;
    return { total: tot, ocupadas: ocup, libres: Math.max(tot - ocup, 0) };
  }, [camas]);

  /* buscar beneficiarios (disponibles) */
  const buscar = async (txt) => {
    setBuscando(true);
    try {
      const { data } = await api.get("/habitaciones/_aux/beneficiarios/disponibles", {
        params: { sexo, q: txt, limit: 10 }
      });
      setResBen(data?.items || []);
    } catch (e) { console.error(e); setResBen([]); }
    finally { setBuscando(false); }
  };
  useEffect(() => {
    if (!picker) return;
    const id = setTimeout(()=> buscar(qBen), 250);
    return () => clearTimeout(id);
  }, [qBen, picker]);

  /* acciones */
  const asignar = async (id_cama, id_beneficiario) => {
    try {
      await api.patch(`/habitaciones/camas/${id_cama}/asignar`, { id_beneficiario });
      setPicker(null);
      await cargarCamas();
      await cargarRooms();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Error al asignar");
    }
  };
  const liberar = async (id_cama) => {
    if (!confirm("¿Liberar plaza?")) return;
    try {
      await api.patch(`/habitaciones/camas/${id_cama}/liberar`);
      await cargarCamas();
      await cargarRooms();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Error al liberar");
    }
  };
  const generar = async () => {
    if (!roomId) return;
    try {
      await api.post(`/habitaciones/${roomId}/generar-camas`, { literas: Number(literasN) || 1 });
      setShowGen(false);
      await cargarCamas();
      await cargarRooms();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "No se pudieron generar las literas");
    }
  };

  /* etiqueta de litera con letra también (A, B, C…) */
  const literasWithLetters = useMemo(() => {
    return literas.map((l, i) => ({
      ...l,
      letter: String.fromCharCode(65 + i) // 0->A, 1->B…
    }));
  }, [literas]);

  return (
    <div style={{ padding: 18 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <h2 style={{ margin:0, fontSize:26, fontWeight:800 }}>Habitaciones</h2>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <Pill tone="#eef2ff" fg="#1d4ed8">Plazas: {kpi.total}</Pill>
          <Pill tone="#ecfdf5" fg="#065f46">Libres: {kpi.libres}</Pill>
          <Pill tone="#fff7ed" fg="#9a3412">Ocupadas: {kpi.ocupadas}</Pill>
        </div>
      </div>

      {/* Tabs H / M + selector de habitación (si hay varias) + generar + expand/collapse */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
        <div style={{ display:"inline-flex", border:"1px solid #d6dae1", borderRadius:12, overflow:"hidden" }}>
          <button onClick={()=>setSexo("H")}
            style={{ padding:"10px 14px", fontWeight:700, border:"none",
              background: sexo==="H" ? "#2563eb" : "#f8fafc",
              color: sexo==="H" ? "#fff" : "#0f172a", cursor:"pointer" }}>
            Hombres
          </button>
          <button onClick={()=>setSexo("M")}
            style={{ padding:"10px 14px", fontWeight:700, borderLeft:"1px solid #d6dae1",
              background: sexo==="M" ? "#db2777" : "#f8fafc",
              color: sexo==="M" ? "#fff" : "#0f172a", cursor:"pointer" }}>
            Mujeres
          </button>
        </div>

        {rooms.length > 1 && (
          <Select value={roomId || ""} onChange={e=>setRoomId(Number(e.target.value)||null)}>
            {rooms.map(r => (
              <option key={r.id_habitacion} value={r.id_habitacion}>
                {r.nombre} · Piso {r.piso ?? "—"}
              </option>
            ))}
          </Select>
        )}

        <Button tone="gray" onClick={()=> setShowGen(true)}>+ Generar literas</Button>
        <Button tone="soft" onClick={expandAll}>Expandir todo</Button>
        <Button tone="ghost" onClick={collapseAll}>Colapsar todo</Button>
      </div>

      {err && <div style={{ color:"#b91c1c", fontWeight:700, marginBottom:8 }}>{err}</div>}
      {msg && <div style={{ color:"#065f46", fontWeight:700, marginBottom:8 }}>{msg}</div>}

      {/* Lista de literas como acordeón */}
      {loading ? (
        <div style={{ padding:10 }}>Cargando…</div>
      ) : !roomId ? (
        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:16, color:"#64748b" }}>
          No hay habitación creada para {sexo === "H" ? "Hombres" : "Mujeres"}.
        </div>
      ) : (
        <div style={{ display:"grid", gap:12 }}>
          {literasWithLetters.map(l => {
            const ocupadas = l.plazas.filter(p => p.estado === "OCUPADA").length;
            const key = String(l.litera);
            const isOpen = openKeys.has(key);

            return (
              <div key={`lit-${key}`}
                   style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, overflow:"hidden" }}>
                {/* Header litera (click para abrir/cerrar) */}
                <button
                  onClick={() => toggleOpen(key)}
                  style={{
                    width:"100%", textAlign:"left",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"12px 14px", background:"linear-gradient(180deg, #f9fbff, #fff)",
                    border:"none", cursor:"pointer"
                  }}
                >
                  <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
                    <strong style={{ fontSize:18 }}>
                      {/* Muestra “Litera A (n)” si quieres la numeración original entre paréntesis */}
                      Litera {l.letter}{String(l.litera ?? "") !== "" ? ` (${l.litera})` : ""}
                    </strong>
                    <span style={{ color:"#64748b", fontWeight:700 }}>•</span>
                    <span style={{ color:"#475569", fontWeight:700 }}>{ocupadas}/3 ocupadas</span>
                  </div>

                  <span
                    aria-hidden
                    style={{
                      width:28, height:28, borderRadius:8, border:"1px solid #dbe3f0",
                      display:"grid", placeItems:"center", transition:"transform .18s ease",
                      transform: `rotate(${isOpen ? 90 : 0}deg)`
                    }}
                  >
                    ›
                  </span>
                </button>

                {/* Cuerpo litera */}
                {isOpen && (
                  <div style={{ padding:"10px 12px", borderTop:"1px solid #eaf0fb", display:"grid", gap:8 }}>
                    {l.plazas.map(p => (
                      <div key={p.id_cama}
                        style={{
                          display:"grid",
                          gridTemplateColumns:"auto 1fr auto",
                          alignItems:"center", gap:10,
                          padding:"10px 12px",
                          borderRadius:10,
                          border:"1px solid #e2e8f0",
                          background: p.estado==="OCUPADA" ? "#fff7ed" : "#f8fafc"
                        }}>
                        {/* Comp con letra A/B/C */}
                        <div>
                          <div style={{ fontSize:12, color:"#64748b" }}>Plaza</div>
                          <div style={{ fontWeight:800 }}>{compLetter(p.compartimiento)}</div>
                        </div>

                        {/* Beneficiario */}
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:12, color:"#64748b" }}>Beneficiario</div>
                          <div style={{ fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                            {p.beneficiario ? fullName(p.beneficiario) : "—"}
                          </div>
                        </div>

                        {/* Acciones */}
                        {p.estado === "OCUPADA" ? (
                          <Button tone="danger" onClick={()=>liberar(p.id_cama)}>Liberar</Button>
                        ) : (
                          picker === p.id_cama ? (
                            <div style={{ gridColumn:"1 / -1", display:"grid", gap:8 }}>
                              <div style={{ display:"flex", gap:8 }}>
                                <Input
                                  placeholder="Buscar beneficiario…"
                                  value={qBen}
                                  onChange={(e)=>setQBen(e.target.value)}
                                  autoFocus
                                />
                                <Button tone="ghost" onClick={() => { setPicker(null); setQBen(""); setResBen([]); }}>
                                  Cerrar
                                </Button>
                              </div>

                              <div style={{ display:"grid", gap:6 }}>
                                {buscando && <div>Buscando…</div>}
                                {!buscando && qBen && resBen.length===0 && (
                                  <div style={{ color:"#64748b" }}>Sin resultados</div>
                                )}
                                {resBen.map(b => (
                                  <div key={b.id_beneficiario}
                                       style={{
                                         display:"flex", justifyContent:"space-between",
                                         border:"1px solid #e2e8f0", borderRadius:10,
                                         padding:"8px 10px", background:"#fff"
                                       }}>
                                    <div>
                                      <div style={{ fontWeight:700 }}>{fullName(b)}</div>
                                      <div style={{ fontSize:12, color:"#475569" }}>
                                        Doc: {b.documento ?? "—"} · Tel: {b.telefono ?? "—"}
                                      </div>
                                    </div>
                                    <Button onClick={()=>asignar(p.id_cama, b.id_beneficiario)}>Elegir</Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <Button tone="soft" onClick={()=>{ setPicker(p.id_cama); setQBen(""); setResBen([]); }}>
                              Asignar
                            </Button>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal generar literas */}
      {showGen && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,.4)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:50
        }}>
          <div style={{ width:420, background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:16 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <h3 style={{ margin:0, fontSize:18, fontWeight:800 }}>Generar literas</h3>
              <Button tone="ghost" onClick={()=>setShowGen(false)}>Cerrar</Button>
            </div>
            {!roomId ? (
              <div style={{ color:"#64748b" }}>Primero crea/selecciona una habitación.</div>
            ) : (
              <div style={{ display:"grid", gap:8 }}>
                <label style={{ fontSize:12, color:"#475569" }}>Cantidad de literas (3 plazas por litera)</label>
                <Input type="number" min={1} value={literasN} onChange={e=>setLiterasN(e.target.value)} />
                <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                  <Button tone="ghost" onClick={()=>setShowGen(false)}>Cancelar</Button>
                  <Button onClick={generar}>Generar</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
