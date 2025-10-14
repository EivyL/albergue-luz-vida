// src/screens/HabitacionDetalle.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";

export default function HabitacionDetalle() {
  const { id } = useParams();
  const [hab, setHab] = useState(null);
  const [camas, setCamas] = useState([]);
  const [literasToAdd, setLiterasToAdd] = useState("");
  const [seleccionCama, setSeleccionCama] = useState(null);
  const [q, setQ] = useState("");
  const [bene, setBene] = useState([]);

  const cargarHabitacion = async () => {
    // Reusa el listado y filtra una (o crea endpoint GET /habitaciones/:id)
    const { data } = await api.get("/habitaciones");
    const one = (data.items || []).find(x => String(x.id_habitacion) === String(id));
    setHab(one || null);
  };

  const cargarCamas = async () => {
    const { data } = await api.get(`/habitaciones/${id}/camas`);
    setCamas(data.items || []);
  };

  const buscarBeneficiarios = async () => {
    if (!hab) return;
    const { data } = await api.get(`/habitaciones/_aux/beneficiarios/disponibles`, {
      params: { sexo: hab.sexo, q }
    });
    setBene(data.items || []);
  };

  const generar = async () => {
    const n = Number(literasToAdd || 0);
    if (!n) return;
    await api.post(`/habitaciones/${id}/generar-camas`, { literas: n });
    setLiterasToAdd("");
    await cargarHabitacion();
    await cargarCamas();
  };

  const asignar = async (id_cama, id_beneficiario) => {
    await api.patch(`/habitaciones/camas/${id_cama}/asignar`, { id_beneficiario });
    setSeleccionCama(null);
    await cargarCamas();
  };

  const liberar = async (id_cama) => {
    await api.patch(`/habitaciones/camas/${id_cama}/liberar`);
    await cargarCamas();
  };

  useEffect(()=>{ cargarHabitacion(); cargarCamas(); }, [id]);

  const porLitera = useMemo(()=>{
    return camas.reduce((acc, c) => {
      (acc[c.litera] ||= []).push(c);
      acc[c.litera].sort((a,b)=>a.compartimiento-b.compartimiento);
      return acc;
    }, {});
  }, [camas]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Habitación {hab?.nombre || id}</h1>
          <div className="text-sm text-gray-500">
            Sexo: {hab?.sexo === "H" ? "Hombres" : "Mujeres"} ·
            Libres: <b>{hab?.libres ?? 0}</b> ·
            Ocupadas: <b>{hab?.ocupadas ?? 0}</b>
          </div>
        </div>
        <Link to="/habitaciones" className="px-3 py-1 border rounded hover:bg-gray-100">Volver</Link>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={literasToAdd}
          onChange={e=>setLiterasToAdd(e.target.value)}
          placeholder="Literas a crear"
          className="border rounded px-2 py-1 w-40"
        />
        <button onClick={generar} className="px-3 py-1 border rounded hover:bg-gray-100">Agregar literas</button>
      </div>

      {/* Panel Asignación */}
      {seleccionCama && (
        <div className="border rounded-lg p-3 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">
              Asignar cama (Litera {seleccionCama.litera}-{seleccionCama.compartimiento})
            </div>
            <button onClick={()=>setSeleccionCama(null)} className="px-3 py-1 border rounded">Cerrar</button>
          </div>
          <div className="flex gap-2 mb-2">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar beneficiario..." className="border rounded px-2 py-1 flex-1" />
            <button onClick={buscarBeneficiarios} className="px-3 py-1 border rounded">Buscar</button>
          </div>
          <div className="max-h-56 overflow-auto border rounded">
            {bene.map(b => (
              <div key={b.id_beneficiario} className="flex items-center justify-between p-2 border-b">
                <div>
                  <div className="font-medium">{b.nombre}</div>
                  <div className="text-xs text-gray-500">{b.sexo === 'H' ? 'Hombre' : 'Mujer'}</div>
                </div>
                <button onClick={()=>asignar(seleccionCama.id_cama, b.id_beneficiario)} className="px-3 py-1 border rounded hover:bg-gray-100">Asignar</button>
              </div>
            ))}
            {!bene.length && <div className="p-3 text-sm text-gray-500">Sin resultados</div>}
          </div>
        </div>
      )}

      {/* Tabla por litera */}
      <div className="space-y-3">
        {Object.keys(porLitera).length === 0 && (
          <div className="text-sm text-gray-500">No hay camas aún. Usa “Agregar literas”.</div>
        )}
        {Object.entries(porLitera).map(([lit, filas]) => (
          <div key={lit} className="bg-white border rounded-lg">
            <div className="px-3 py-2 font-medium border-b">Litera {lit}</div>
            <div className="grid grid-cols-3 gap-2 p-3">
              {filas.map(c => (
                <div key={c.id_cama} className={`rounded-lg border p-2 ${c.estado === "OCUPADA" ? "bg-red-50" : "bg-green-50"}`}>
                  <div className="text-sm flex justify-between">
                    <span>Comp. {c.compartimiento}</span>
                    <span className={`text-xs ${c.estado==="OCUPADA"?"text-red-700":"text-green-700"}`}>{c.estado}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-600">Beneficiario: {c.id_beneficiario ?? "-"}</div>
                  <div className="mt-2 flex gap-2">
                    {c.estado === "LIBRE" ? (
                      <button onClick={()=>setSeleccionCama(c)} className="px-2 py-1 text-xs border rounded hover:bg-gray-100">Asignar</button>
                    ) : (
                      <button onClick={()=>liberar(c.id_cama)} className="px-2 py-1 text-xs border rounded hover:bg-gray-100">Liberar</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
