// src/screens/Compras.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../api";

/** Util: mapear objetos de inventario heterogéneos a {id,name,unidad?} */
function mapProducto(p) {
  const id =
    p?.id_inventario ?? p?.id ?? p?.producto_id ?? p?.ID ?? null;
  const name =
    p?.nombre ?? p?.nombre_producto ?? p?.producto ?? p?.NAME ?? "";
  const unidad = p?.unidad_medida ?? p?.unidad ?? null;
  return { id, name, unidad };
}

/** Util: mapear proveedores a {id,name} si existe el endpoint */
function mapProveedor(pr) {
  const id =
    pr?.id_proveedor ?? pr?.proveedor_id ?? pr?.id ?? pr?.ID ?? null;
  const name =
    pr?.nombre ?? pr?.razon_social ?? pr?.name ?? pr?.NOMBRE ?? `Proveedor #${id}`;
  return { id, name };
}

const Row = ({ children, style }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, ...style }}>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <label style={{ display: "grid", gap: 6 }}>
    <span style={{ fontSize: 12, color: "var(--lv-text-muted)" }}>{label}</span>
    {children}
  </label>
);

export default function Compras() {
  /** ---------- catálogos ---------- */
  const [productos, setProductos] = useState([]);   // [{id, name, unidad?}]
  const [proveedores, setProveedores] = useState([]); // [{id, name}]

  /** ---------- formulario ---------- */
  const hoy = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    proveedor_id: "",
    fecha: hoy,
    observaciones: "",
  });

  // Cada ítem: { producto_id, productoNombre, cantidad, precio }
  const [items, setItems] = useState([
    { producto_id: "", productoNombre: "", cantidad: 1, precio: 0 },
  ]);

  /** ---------- estado UI ---------- */
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [lista, setLista] = useState([]);
  const [q, setQ] = useState("");

  /** ---------- totales ---------- */
  const total = useMemo(
    () =>
      items.reduce(
        (acc, it) => acc + (Number(it.cantidad) || 0) * (Number(it.precio) || 0),
        0
      ),
    [items]
  );

  /** ---------- carga catálogos ---------- */
  useEffect(() => {
    (async () => {
      // Productos (inventario)
      try {
        // intenta /inventario primero
        const { data } = await api.get("/inventario", { params: { limit: 1000 } });
        const arr = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        setProductos(arr.map(mapProducto).filter(p => p.id && p.name));
      } catch {
        // fallback silencioso; el usuario podrá escribir manualmente el nombre,
        // pero intenta enviar producto_id (numérico). Si no, tu backend puede
        // resolver por nombre (opcional) como expliqué en el controller.
        setProductos([]);
      }

      // Proveedores (si existe)
      try {
        const { data } = await api.get("/proveedores", { params: { limit: 500 } });
        const arr = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        setProveedores(arr.map(mapProveedor).filter(p => p.id));
      } catch {
        setProveedores([]);
      }
    })();
  }, []);

  /** ---------- carga de compras ---------- */
  const cargar = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/compras", { params: { q } });
      setLista(data?.items || []);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Error cargando compras");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { cargar(); }, []);

  /** ---------- helpers de ítems ---------- */
  const agregarFila = () =>
    setItems([...items, { producto_id: "", productoNombre: "", cantidad: 1, precio: 0 }]);

  const quitarFila = (i) =>
    setItems(items.filter((_, idx) => idx !== i));

  const setItem = (i, patch) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    setItems(next);
  };

  const onProductoInput = (i, value) => {
    // Si el usuario escribe el nombre, sólo guarda productoNombre;
    // si coincide con un producto del catálogo, autocompleta su id.
    const hit = productos.find(p => p.name.toLowerCase() === value.toLowerCase());
    if (hit) setItem(i, { producto_id: hit.id, productoNombre: hit.name });
    else setItem(i, { productoNombre: value, producto_id: "" });
  };

  const onElegirProducto = (i, value) => {
    // value es el id (desde select). Busca y setea también el nombre.
    const hit = productos.find(p => String(p.id) === String(value));
    if (hit) setItem(i, { producto_id: hit.id, productoNombre: hit.name });
    else setItem(i, { producto_id: value });
  };

  /** ---------- submit ---------- */
  const enviar = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");

    try {
      // Validaciones mínimas
      if (!form.proveedor_id) return setErr("Proveedor es requerido (proveedor_id).");
      if (!form.fecha) return setErr("Fecha es requerida.");

      const normItems = items
        .filter(it => (it.producto_id || it.productoNombre) && Number(it.cantidad) > 0)
        .map(it => ({
          // Ideal: enviar producto_id. Si el usuario sólo escribió nombre,
          // tu backend puede resolverlo por nombre (opcional en tu controller).
          producto_id: it.producto_id || null,
          producto: it.productoNombre || null, // snapshot opcional
          cantidad: Number(it.cantidad) || 0,
          precio: Number(it.precio) || 0,
        }));

      if (normItems.length === 0) {
        return setErr("Agrega al menos un ítem válido.");
      }

      const payload = {
        proveedor_id: Number(form.proveedor_id),
        fecha: form.fecha,
        items: normItems,
        observaciones: form.observaciones || null,
      };

      const { data } = await api.post("/compras", payload);
      setMsg(`Compra #${data?.id_compra ?? ""} creada`);
      setForm({ proveedor_id: "", fecha: hoy, observaciones: "" });
      setItems([{ producto_id: "", productoNombre: "", cantidad: 1, precio: 0 }]);
      await cargar();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "Error creando compra");
    }
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar esta compra?")) return;
    try {
      await api.delete(`/compras/${id}`);
      await cargar();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "No se pudo eliminar");
    }
  };

  /** ---------- UI ---------- */
  return (
    <div style={{ padding: 16 }}>
      <div className="glass" style={{ padding: 16, borderRadius: 16, marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: "var(--lv-text)" }}>Compras</h2>
        <p style={{ marginTop: 6, color: "var(--lv-text-muted)" }}>
          Registra una compra seleccionando proveedor y productos del inventario.
        </p>
      </div>

      <form onSubmit={enviar} className="glass" style={{ padding: 16, borderRadius: 16 }}>
        <Row>
          <Field label="Proveedor (ID) *">
            {/* Si tienes /proveedores, muestra un datalist por nombre y guarda el ID elegido */}
            {proveedores.length > 0 ? (
              <>
                <input
                  className="input"
                  list="dl-proveedores"
                  placeholder="Escribe para buscar…"
                  value={
                    form.proveedor_id
                      ? (proveedores.find(p => String(p.id) === String(form.proveedor_id))?.name ?? form.proveedor_id)
                      : ""
                  }
                  onChange={(e) => {
                    const name = e.target.value;
                    const hit = proveedores.find(p => p.name.toLowerCase() === name.toLowerCase());
                    setForm({
                      ...form,
                      proveedor_id: hit ? hit.id : e.target.value.replace(/\D+/g, "")
                    });
                  }}
                  required
                />
                <datalist id="dl-proveedores">
                  {proveedores.map(p => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
                <small style={{ color: "var(--lv-text-muted)" }}>
                  Guarda el <b>ID</b> del proveedor. Si no aparece, escribe el número.
                </small>
              </>
            ) : (
              <input
                className="input"
                type="number"
                min="1"
                placeholder="proveedor_id"
                value={form.proveedor_id}
                onChange={(e)=>setForm({ ...form, proveedor_id: e.target.value })}
                required
              />
            )}
          </Field>

          <Field label="Fecha *">
            <input
              className="input"
              type="date"
              value={form.fecha}
              onChange={(e)=>setForm({ ...form, fecha: e.target.value })}
              required
            />
          </Field>

          <Field label="Observaciones">
            <input
              className="input"
              placeholder="Opcional"
              value={form.observaciones}
              onChange={(e)=>setForm({ ...form, observaciones: e.target.value })}
            />
          </Field>
        </Row>

        {/* Ítems */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 8, alignItems: "end" }}>
            <span style={{ fontSize: 12, color: "var(--lv-text-muted)" }}>Producto</span>
            <span style={{ fontSize: 12, color: "var(--lv-text-muted)" }}>Cant.</span>
            <span style={{ fontSize: 12, color: "var(--lv-text-muted)" }}>Precio</span>
            <span style={{ fontSize: 12, color: "var(--lv-text-muted)" }}>Subtotal</span>
            <span />
          </div>

          {items.map((it, i) => {
            const subtotal = ((Number(it.cantidad) || 0) * (Number(it.precio) || 0)).toFixed(2);
            return (
              <div key={i} className="glass" style={{ padding: 8, borderRadius: 12, marginTop: 8, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 8 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  {/* Autocomplete por nombre y opción por ID */}
                  <input
                    className="input"
                    list={`dl-productos`}
                    placeholder="Buscar producto…"
                    value={it.productoNombre}
                    onChange={(e)=>onProductoInput(i, e.target.value)}
                  />
                  <datalist id={`dl-productos`}>
                    {productos.map(p => (
                      <option key={p.id} value={p.name} />
                    ))}
                  </datalist>

                  {/* Selector por ID (útil si hay duplicados en nombre) */}
                  <select
                    className="input"
                    value={it.producto_id}
                    onChange={(e)=>onElegirProducto(i, e.target.value)}
                  >
                    <option value="">Seleccionar por ID…</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>{p.id} — {p.name}</option>
                    ))}
                  </select>
                </div>

                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={it.cantidad}
                  onChange={(e)=>setItem(i, { cantidad: e.target.value })}
                />

                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={it.precio}
                  onChange={(e)=>setItem(i, { precio: e.target.value })}
                />

                <div className="badge" style={{ alignSelf: "center", justifySelf: "start" }}>
                  Q {subtotal}
                </div>

                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button type="button" className="btn btn-ghost" onClick={()=>quitarFila(i)} disabled={items.length===1}>
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 8 }}>
            <button type="button" className="btn" onClick={agregarFila}>+ Agregar ítem</button>
          </div>
        </div>

        {/* Footer del formulario */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop: 16 }}>
          <div>
            {err && <div style={{ color:"tomato" }}>{err}</div>}
            {msg && <div style={{ color:"#5aa17f" }}>{msg}</div>}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap: 12 }}>
            <div className="badge" style={{ fontWeight: 700, fontSize: 16 }}>
              Total: Q {total.toFixed(2)}
            </div>
            <button type="submit" className="btn">Registrar compra</button>
          </div>
        </div>
      </form>

      {/* Buscador y lista */}
      <div className="glass" style={{ padding: 12, borderRadius: 12, marginTop: 16 }}>
        <div style={{ display:"flex", gap:8, marginBottom:12 }}>
          <input className="input" placeholder="Buscar por proveedor" value={q} onChange={(e)=>setQ(e.target.value)} />
          <button className="btn" onClick={()=>cargar()}>Buscar</button>
          <button className="btn btn-ghost" onClick={()=>{ setQ(""); cargar(); }}>Limpiar</button>
        </div>

        {loading ? <div>Cargando…</div> : (
          <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign:"left", borderBottom:"1px solid var(--lv-border)" }}>
                <th>#</th>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Total</th>
                <th>Ítems</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(!lista || lista.length===0) && (
                <tr><td colSpan="6" style={{opacity:.7}}>Sin datos</td></tr>
              )}
              {lista.map((c)=>(
                <tr key={c.id_compra} style={{ borderBottom:"1px solid #202020" }}>
                  <td>{c.id_compra}</td>
                  <td>{c.fecha}</td>
                  <td>
                    {/* muestra nombre si viene por join, si no muestra ID */}
                    {c.proveedor?.nombre ?? c.proveedor_nombre ?? c.proveedor_id ?? c.proveedor ?? "—"}
                  </td>
                  <td>Q {Number(c.total || 0).toFixed(2)}</td>
                  <td>
                    <details>
                      <summary>ver</summary>
                      <ul>
                        {(c.items||[]).map((it)=>(
                          <li key={it.id_item || it.id_compra_item}>
                            {(it.producto ?? it.producto_nombre ?? `#${it.producto_id}`)} —{" "}
                            {Number(it.cantidad).toFixed(2)} x Q {Number(it.precio ?? it.precio_unitario ?? 0).toFixed(2)}
                            {" "} = Q {Number(it.subtotal ?? (it.cantidad * (it.precio ?? 0))).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </td>
                  <td>
                    <button onClick={()=>eliminar(c.id_compra)} className="btn btn-ghost" style={{ color:"tomato" }}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
