import React, { useEffect, useState } from "react";
import api from "../api";

const Card = ({children}) => (
  <div className="card" style={{padding:16}}>
    {children}
  </div>
);

export default function HabitacionesLista() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const cargar = async () => {
    setLoading(true); setErr("");
    try {
      const { data } = await api.get("/literas", { params: { q } });
      setItems(data.items || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Error cargando literas");
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const crearLitera = async () => {
    const codigo = prompt("Código de la litera (ej. A-01)");
    if (!codigo) return;
    try {
      await api.post("/literas", { codigo });
      await cargar();
    } catch (e) {
      alert(e?.response?.data?.message || "No se pudo crear");
    }
  };

  const asignar = async (id_litera, slot) => {
    const id_beneficiario = prompt("ID del beneficiario:");
    if (!id_beneficiario) return;
    try {
      await api.post(`/literas/${id_litera}/slots/${slot}/asignar`, { id_beneficiario });
      setMsg("Asignado");
      await cargar();
    } catch (e) {
      alert(e?.response?.data?.message || "Error al asignar");
    }
  };

  const liberar = async (id_litera, slot) => {
    if (!confirm("¿Liberar este espacio?")) return;
    try {
      await api.post(`/literas/${id_litera}/slots/${slot}/liberar`);
      setMsg("Liberado");
      await cargar();
    } catch (e) {
      alert(e?.response?.data?.message || "Error al liberar");
    }
  };

  const autoAsignar = async () => {
    const id_beneficiario = prompt("ID del beneficiario para auto-asignar:");
    if (!id_beneficiario) return;
    try {
      await api.post("/literas/auto-asignar", { id_beneficiario });
      setMsg("Auto-asignado");
      await cargar();
    } catch (e) {
      alert(e?.response?.data?.message || "No se pudo auto-asignar");
    }
  };

  return (
    <div style={{padding:16, display:"grid", gap:12}}>
      <div style={{display:"flex", gap:8, alignItems:"center"}}>
        <input className="input" placeholder="Buscar por código/área…" value={q} onChange={e=>setQ(e.target.value)} />
        <button className="btn" onClick={cargar}>Buscar</button>
        <button className="btn btn-ghost" onClick={()=>{setQ(""); cargar();}}>Limpiar</button>
        <div style={{flex:1}}/>
        <button className="btn btn-primary" onClick={autoAsignar}>Auto-asignar</button>
        <button className="btn" onClick={crearLitera}>Nueva litera</button>
      </div>

      {err && <div className="badge" style={{background:"var(--lv-danger-100)", color:"#991b1b"}}>{err}</div>}
      {msg && <div className="badge" style={{background:"var(--lv-success-100)", color:"#166534"}}>{msg}</div>}

      {loading ? <div>Cargando…</div> : (
        <div style={{display:"grid", gap:12, gridTemplateColumns:"repeat(auto-fill, minmax(340px,1fr))"}}>
          {items.map(l => (
            <Card key={l.id_litera}>
              <div style={{display:"flex", justifyContent:"space-between", marginBottom:8}}>
                <div>
                  <b>{l.codigo}</b>
                  <div style={{fontSize:12, color:"var(--lv-text-muted)"}}>
                    {l.area || "—"} · Piso {l.piso ?? "—"}
                  </div>
                </div>
                <div className="badge">Libres: {l.libres}/3</div>
              </div>

              <div style={{display:"grid", gap:8, gridTemplateColumns:"repeat(3, 1fr)"}}>
                {l.slots.map(s => (
                  <div key={s.slot} className="card" style={{padding:10}}>
                    <div style={{display:"flex", justifyContent:"space-between", marginBottom:6}}>
                      <b>S{s.slot}</b>
                      <span className={
                        s.estado === "LIBRE" ? "badge chip--libre" :
                        s.estado === "OCUPADA" ? "badge" :
                        s.estado === "RESERVA" ? "badge chip--reservada" :
                        "badge chip--mantenimiento"
                      }>{s.estado}</span>
                    </div>

                    {s.ocupante ? (
                      <div style={{fontSize:14}}>
                        {s.ocupante.nombre} {s.ocupante.apellido}
                      </div>
                    ) : <div style={{height:18, color:"var(--lv-text-muted)"}}>—</div>}

                    <div style={{display:"flex", gap:6, marginTop:10, flexWrap:"wrap"}}>
                      {s.estado === "LIBRE" && (
                        <button className="btn btn-primary" onClick={()=>asignar(l.id_litera, s.slot)}>Asignar</button>
                      )}
                      {s.estado === "OCUPADA" && (
                        <button className="btn" onClick={()=>liberar(l.id_litera, s.slot)}>Liberar</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
