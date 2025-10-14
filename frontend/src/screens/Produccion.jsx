// frontend/src/screens/Produccion.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../api";

const filaConsumo = () => ({ producto: "", cantidad: 1, unidad: "unid" });
const filaProducto = () => ({ producto: "", cantidad: 1, unidad: "unid" });

export default function Produccion() {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0,10),
    responsable: "",
    observaciones: ""
  });

  const [consumo, setConsumo] = useState([filaConsumo()]);
  const [productos, setProductos] = useState([filaProducto()]);
  const [lista, setLista] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const totalConsumo = useMemo(() =>
    consumo.reduce((a, it) => a + (Number(it.cantidad)||0), 0)
  , [consumo]);

  const totalProductos = useMemo(() =>
    productos.reduce((a, it) => a + (Number(it.cantidad)||0), 0)
  , [productos]);

  const cargar = async () => {
    setLoading(true); setErr("");
    try {
      const { data } = await api.get("/produccion", { params: { q } });
      setLista(data.items || []);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Error cargando producciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ cargar(); }, []);

  const setRow = (arr, setArr, i, key, val) => {
    const copy = [...arr];
    copy[i] = { ...copy[i], [key]: val };
    setArr(copy);
  };
  const addRow = (arr, setArr, factory) => setArr([...arr, factory()]);
  const delRow = (arr, setArr, i) => setArr(arr.filter((_, idx) => idx !== i));

  const enviar = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");
    try {
      if (!form.fecha) return setErr("La fecha es requerida");

      const payload = {
        fecha: form.fecha,
        responsable: form.responsable || null,
        observaciones: form.observaciones || null,
        consumo: consumo
          .filter(it => it.producto && Number(it.cantidad) > 0)
          .map(it => ({ producto: it.producto, cantidad: Number(it.cantidad), unidad: it.unidad || null })),
        productos: productos
          .filter(it => it.producto && Number(it.cantidad) > 0)
          .map(it => ({ producto: it.producto, cantidad: Number(it.cantidad), unidad: it.unidad || null })),
      };

      if (payload.consumo.length === 0 && payload.productos.length === 0) {
        return setErr("Agrega al menos un consumo o producto");
      }

      await api.post("/produccion", payload);
      setMsg("Producción registrada");
      setForm({ fecha: new Date().toISOString().slice(0,10), responsable: "", observaciones: "" });
      setConsumo([filaConsumo()]);
      setProductos([filaProducto()]);
      await cargar();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Error creando producción");
    }
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar producción?")) return;
    try {
      await api.delete(`/produccion/${id}`);
      await cargar();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "No se pudo eliminar");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Producción</h2>

      <form onSubmit={enviar} style={{ display:"grid", gap:12, gridTemplateColumns:"repeat(3, 1fr)" }}>
        <input type="date" value={form.fecha}
               onChange={(e)=>setForm({...form, fecha: e.target.value})} required />
        <input placeholder="Responsable" value={form.responsable}
               onChange={(e)=>setForm({...form, responsable: e.target.value})} />
        <input placeholder="Observaciones" value={form.observaciones}
               onChange={(e)=>setForm({...form, observaciones: e.target.value})} />

        {/* Consumo de insumos */}
        <div style={{ gridColumn:"1 / -1" }}>
          <h3>Consumo de insumos (resta del inventario)</h3>
          <table width="100%" cellPadding="8" style={{ borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ textAlign:"left", borderBottom:"1px solid #3a3a3a" }}>
                <th style={{width:"55%"}}>Producto</th>
                <th style={{width:"15%"}}>Cantidad</th>
                <th style={{width:"15%"}}>Unidad</th>
                <th style={{width:"15%"}}></th>
              </tr>
            </thead>
            <tbody>
              {consumo.map((it,i)=>(
                <tr key={`c-${i}`} style={{ borderBottom:"1px solid #202020" }}>
                  <td><input value={it.producto} placeholder="Nombre insumo"
                             onChange={(e)=>setRow(consumo,setConsumo,i,"producto",e.target.value)} /></td>
                  <td><input type="number" step="0.01" min="0" value={it.cantidad}
                             onChange={(e)=>setRow(consumo,setConsumo,i,"cantidad",e.target.value)} /></td>
                  <td><input value={it.unidad} placeholder="unid/kg/lt"
                             onChange={(e)=>setRow(consumo,setConsumo,i,"unidad",e.target.value)} /></td>
                  <td>
                    <button type="button" onClick={()=>delRow(consumo,setConsumo,i)} disabled={consumo.length===1}>🗑️</button>
                  </td>
                </tr>
              ))}
              <tr><td colSpan="4"><button type="button" onClick={()=>addRow(consumo,setConsumo,filaConsumo)}>+ Agregar insumo</button></td></tr>
            </tbody>
          </table>
          <div style={{ textAlign:"right", marginTop:8 }}>Total insumos: <b>{totalConsumo}</b></div>
        </div>

        {/* Productos terminados */}
        <div style={{ gridColumn:"1 / -1" }}>
          <h3>Productos terminados (suma al inventario)</h3>
          <table width="100%" cellPadding="8" style={{ borderCollapse:"collapse" }}>
            <thead>
            <tr style={{ textAlign:"left", borderBottom:"1px solid #3a3a3a" }}>
              <th style={{width:"55%"}}>Producto</th>
              <th style={{width:"15%"}}>Cantidad</th>
              <th style={{width:"15%"}}>Unidad</th>
              <th style={{width:"15%"}}></th>
            </tr>
            </thead>
            <tbody>
            {productos.map((it,i)=>(
              <tr key={`p-${i}`} style={{ borderBottom:"1px solid #202020" }}>
                <td><input value={it.producto} placeholder="Nombre producto"
                           onChange={(e)=>setRow(productos,setProductos,i,"producto",e.target.value)} /></td>
                <td><input type="number" step="0.01" min="0" value={it.cantidad}
                           onChange={(e)=>setRow(productos,setProductos,i,"cantidad",e.target.value)} /></td>
                <td><input value={it.unidad} placeholder="unid/kg/lt"
                           onChange={(e)=>setRow(productos,setProductos,i,"unidad",e.target.value)} /></td>
                <td>
                  <button type="button" onClick={()=>delRow(productos,setProductos,i)} disabled={productos.length===1}>🗑️</button>
                </td>
              </tr>
            ))}
            <tr><td colSpan="4"><button type="button" onClick={()=>addRow(productos,setProductos,filaProducto)}>+ Agregar producto</button></td></tr>
            </tbody>
          </table>
          <div style={{ textAlign:"right", marginTop:8 }}>Total productos: <b>{totalProductos}</b></div>
        </div>

        {err && <div style={{ gridColumn:"1 / -1", color:"tomato" }}>{err}</div>}
        {msg && <div style={{ gridColumn:"1 / -1", color:"#5aa17f" }}>{msg}</div>}

        <div style={{ gridColumn:"1 / -1" }}>
          <button type="submit">Registrar producción</button>
        </div>
      </form>

      <hr style={{ margin:"24px 0", borderColor:"#333" }} />

      {/* BUSCAR / LISTADO */}
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <input placeholder="Buscar por responsable" value={q} onChange={(e)=>setQ(e.target.value)} />
        <button onClick={cargar}>Buscar</button>
        <button onClick={()=>{ setQ(""); cargar(); }}>Limpiar</button>
      </div>

      {loading ? <div>Cargando…</div> : (
        <table width="100%" cellPadding="8" style={{ borderCollapse:"collapse" }}>
          <thead>
          <tr style={{ textAlign:"left", borderBottom:"1px solid #3a3a3a" }}>
            <th>#</th>
            <th>Fecha</th>
            <th>Responsable</th>
            <th>Detalles</th>
            <th>Acciones</th>
          </tr>
          </thead>
          <tbody>
          {lista.length===0 && <tr><td colSpan="5" style={{opacity:.7}}>Sin datos</td></tr>}
          {lista.map(p=>(
            <tr key={p.id_produccion} style={{ borderBottom:"1px solid #202020" }}>
              <td>{p.id_produccion}</td>
              <td>{p.fecha}</td>
              <td>{p.responsable || "-"}</td>
              <td>
                <details>
                  <summary>ver</summary>
                  <div style={{ display:"flex", gap:24 }}>
                    <div>
                      <b>Consumo</b>
                      <ul>
                        {(p.detalles||[]).filter(d=>d.tipo==="CONSUMO").map(d=>(
                          <li key={d.id_produccion_detalle}>{d.producto} — {d.cantidad} {d.unidad||""}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <b>Productos</b>
                      <ul>
                        {(p.detalles||[]).filter(d=>d.tipo==="PRODUCTO").map(d=>(
                          <li key={d.id_produccion_detalle}>{d.producto} — {d.cantidad} {d.unidad||""}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </details>
              </td>
              <td>
                <button onClick={()=>eliminar(p.id_produccion)} style={{ color:"tomato" }}>Eliminar</button>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
