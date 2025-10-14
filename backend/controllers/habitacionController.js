// backend/controllers/habitacionController.js
import { Op, fn, col, literal } from "sequelize";
import { Habitacion, Cama, Beneficiario } from "../Models/index.js";

/** helper para resumen */
const toResume = (h, agg) => ({
  id_habitacion: h.id_habitacion,
  nombre: h.nombre,
  sexo: h.sexo,
  piso: h.piso,
  capacidad_literas: h.capacidad_literas,
  total_camas: Number(agg?.total_camas || 0),
  libres: Number(agg?.libres || 0),
  ocupadas: Number(agg?.ocupadas || 0),
});

/** GET /habitaciones?sexo=H|M */
export const listarHabitaciones = async (req, res) => {
  try {
    const { sexo } = req.query;
    const where = { activa: true };
    if (sexo) where.sexo = sexo;

    const rooms = await Habitacion.findAll({ where, order: [["nombre", "ASC"]] });

    const counts = await Cama.findAll({
      attributes: [
        "id_habitacion",
        [fn("COUNT", col("id_cama")), "total_camas"],
        [fn("SUM", literal(`CASE WHEN estado='LIBRE' THEN 1 ELSE 0 END`)), "libres"],
        [fn("SUM", literal(`CASE WHEN estado='OCUPADA' THEN 1 ELSE 0 END`)), "ocupadas"],
      ],
      group: ["id_habitacion"],
    });

    const map = Object.fromEntries(counts.map(c => [String(c.id_habitacion), c.get()]));
    const data = rooms.map(h => toResume(h, map[String(h.id_habitacion)]));

    res.json({ items: data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error listando habitaciones" });
  }
};

/** GET /habitaciones/:id/camas */
export const listarCamasDeHabitacion = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await Cama.findAll({
      where: { id_habitacion: id },
      order: [["litera","ASC"], ["compartimiento","ASC"]],
      attributes: [
        "id_cama","id_habitacion","litera","compartimiento",
        "estado","id_beneficiario","fecha_asignacion","created_at","updated_at"
      ],
      include: [
        {
          model: Beneficiario,
          as: "beneficiario",             // alias exacto de la asociación
          attributes: [                   // <-- SOLO columnas que existen
            "id_beneficiario",
            "nombre",
            "apellido",
            "documento",
            "telefono",
            "sexo",
          ],
          required: false,
        },
      ],
    });

    const items = rows.map(r => {
      const b = r.beneficiario;
      const full =
        (b && `${b.nombre ?? ""} ${b.apellido ?? ""}`.trim()) || null;

      return {
        id_cama: r.id_cama,
        id_habitacion: r.id_habitacion,
        litera: r.litera,
        compartimiento: r.compartimiento,
        estado: r.estado,
        id_beneficiario: b?.id_beneficiario ?? null,
        beneficiario: full || b?.documento || null,
        fecha_asignacion: r.fecha_asignacion,
      };
    });

    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error listando camas" });
  }
};

/** POST /habitaciones/:id/generar-camas  body: { literas } */
export const generarCamas = async (req, res) => {
  try {
    const { id } = req.params;
    const n = Number(req.body?.literas ?? 0);
    if (!n || n < 1) return res.status(400).json({ message: "literas > 0 requerido" });

    const hab = await Habitacion.findByPk(id);
    if (!hab) return res.status(404).json({ message: "Habitación no encontrada" });

    const payload = [];
    for (let l = 1; l <= n; l++) {
      for (let c = 1; c <= 3; c++) {
        payload.push({
          id_habitacion: hab.id_habitacion,
          litera: l,
          compartimiento: c,
          estado: "LIBRE",
          codigo: `${hab.nombre ?? `H${hab.id_habitacion}`}-L${l}-C${c}`, // NOT NULL
        });
      }
    }

    await Cama.bulkCreate(payload, {
      ignoreDuplicates: true,
      validate: true,
      individualHooks: true,
      fields: ["id_habitacion","litera","compartimiento","estado","codigo","id_beneficiario","fecha_asignacion"],
    });

    await hab.update({ capacidad_literas: n });

    res.status(201).json({ message: "Camas generadas", total: payload.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error generando camas" });
  }
};

/** PATCH /habitaciones/camas/:id/asignar { id_beneficiario } */
export const asignarCama = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_beneficiario } = req.body;
    if (!id_beneficiario) return res.status(400).json({ message: "id_beneficiario requerido" });

    const cama = await Cama.findByPk(id, { include: [{ model: Habitacion, as: "habitacion" }] });
    if (!cama) return res.status(404).json({ message: "Cama no encontrada" });
    if (cama.estado === "OCUPADA") return res.status(409).json({ message: "La cama ya está ocupada" });

    const bene = await Beneficiario.findByPk(id_beneficiario);
    if (!bene || bene.estado === false) return res.status(404).json({ message: "Beneficiario no válido" });

    if ((cama.habitacion?.sexo || "") !== (bene.sexo || "")) {
      return res.status(400).json({ message: "Sexo de beneficiario no coincide con la habitación" });
    }

    const ya = await Cama.findOne({ where: { id_beneficiario } });
    if (ya) return res.status(409).json({ message: "El beneficiario ya tiene una cama asignada" });

    await cama.update({ estado: "OCUPADA", id_beneficiario, fecha_asignacion: new Date() });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error asignando cama" });
  }
};

/** PATCH /habitaciones/camas/:id/liberar */
export const liberarCama = async (req, res) => {
  try {
    const { id } = req.params;
    const cama = await Cama.findByPk(id);
    if (!cama) return res.status(404).json({ message: "Cama no encontrada" });

    await cama.update({ estado: "LIBRE", id_beneficiario: null, fecha_asignacion: null });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error liberando cama" });
  }
};

/** GET /habitaciones/_aux/beneficiarios/disponibles?sexo=H|M&q=... */
export const beneficiariosDisponibles = async (req, res) => {
  try {
    const { sexo, q = "" } = req.query;

    // IDs de beneficiarios ya asignados
    const ocupadas = await Cama.findAll({
      attributes: ["id_beneficiario"],
      where: { id_beneficiario: { [Op.ne]: null } },
    });
    const taken = ocupadas.map(x => x.id_beneficiario).filter(Boolean);

    const base = { estado: true };
    if (sexo) base.sexo = sexo;

    const where = q
      ? {
          ...base,
          [Op.or]: [
            { nombre:   { [Op.iLike]: `%${q}%` } },
            { apellido: { [Op.iLike]: `%${q}%` } },
            { documento:{ [Op.iLike]: `%${q}%` } },
          ],
        }
      : base;

    const items = await Beneficiario.findAll({
      where: taken.length ? { ...where, id_beneficiario: { [Op.notIn]: taken } } : where,
      order: [["nombre","ASC"]],
      limit: 20,
    });

    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error listando beneficiarios" });
  }
};
