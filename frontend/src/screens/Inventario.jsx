// frontend/src/screens/Inventario.jsx
import React, { useEffect, useState } from "react";
import api from "../api";

export default function Inventario() {
  const [items, setItems] = useState([]);           // siempre arreglo
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // formulario
  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [unidad, setUnidad] = useState("");

  const cargar = async () => {
    setLoading(true);
    setErr("");
    try {
      const resp = await api.get("/inventario");
      console.log("Respuesta inventario:", resp.data);

      // Asegura que sea un array aunque el backend devuelva objeto {rows: []}
      const arr = Array.isArray(resp.data)
        ? resp.data
        : (resp.data?.rows ?? []);

      setItems(arr);
    } catch (e) {
      console.error("Error cargando inventario:", e);
      setErr(e?.response?.data?.message || "Error al cargar inventario");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const crear = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await api.post("/inventario", {
        nombre_producto: nombre,
        cantidad: Number(cantidad),
        unidad_medida: unidad,
      });

      // limpiar formulario y recargar
      setNombre("");
      setCantidad("");
      setUnidad("");
      await cargar();
    } catch (e) {
      console.error("Error creando item:", e);
      setErr(e?.response?.data?.message || "Error al crear item");
    }
  };

  const borrar = async (id) => {
    if (!window.confirm("¿Eliminar este item?")) return;
    try {
      await api.delete(`/inventario/${id}`);
      await cargar();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "No se pudo eliminar");
    }
  };

  const mas = async (id, delta) => {
    try {
      await api.patch(`/inventario/${id}/ajustar`, { delta });
      await cargar();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "No se pudo ajustar");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Inventario</h2>

      <form onSubmit={crear} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Nombre del producto"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Cantidad"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          min={0}
          required
        />
        <input
          placeholder="Unidad (kg, unid, lt...)"
          value={unidad}
          onChange={(e) => setUnidad(e.target.value)}
          required
        />
        <button type="submit">Agregar</button>
      </form>

      {err && <div style={{ color: "red", marginBottom: 12 }}>{err}</div>}

      {loading ? (
        <div>Cargando...</div>
      ) : (
        <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #3a3a3a" }}>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Unidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!Array.isArray(items) || items.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ opacity: 0.7 }}>Sin datos</td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id_inventario} style={{ borderBottom: "1px solid #202020" }}>
                  <td>{it.nombre_producto}</td>
                  <td>{it.cantidad}</td>
                  <td>{it.unidad_medida || "-"}</td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => mas(it.id_inventario, +1)}>+1</button>
                    <button onClick={() => mas(it.id_inventario, -1)} disabled={it.cantidad <= 0}>-1</button>
                    <button onClick={() => borrar(it.id_inventario)} style={{ color: "tomato" }}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
9