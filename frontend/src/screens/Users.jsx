import { useEffect, useState } from "react";
import api from "../api";

export default function Users() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/usuarios"); // protegido por rol
      setRows(data);
    } catch (e) {
      setError(e.response?.data?.message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <p>Cargando usuarios…</p>;
  if (error)   return <p style={{color:"red"}}>{error}</p>;

  return (
    <div>
      <h2>Usuarios</h2>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>ID</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Último login</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(u => (
            <tr key={u.idUsuario || u.id_usuario}>
              <td>{u.idUsuario ?? u.id_usuario}</td>
              <td>{u.nombreUsuario ?? u.nombre_usuario}</td>
              <td>{u.correo}</td>
              <td>{u.rol}</td>
              <td>{(u.estado ?? u.estado) ? "Activo" : "Inactivo"}</td>
              <td>{u.ultimoLogin ?? u.ultimo_login ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
