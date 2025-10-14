// backend/controllers/beneficiario.controller.js
import { Op } from "sequelize";
import Beneficiario from "../Models/Beneficiario.js";

const toYYYYMMDD = (v) => {
  if (!v) return null;
  if (/\d{2}\/\d{2}\/\d{4}/.test(v)) return v.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1");
  return v;
};

/** GET /api/beneficiarios */

export const listarBeneficiarios = async (req, res) => {
  try {
    const { q = "", sexo, estado, page = 1, limit = 20 } = req.query;

    const where = {};
    if (sexo === "H" || sexo === "M") where.sexo = sexo;
    if (estado === "true") where.estado = true;
    if (estado === "false") where.estado = false;

    if (q.trim()) {
      const safeQ = q.replace(/'/g, "''");
      where[Op.or] = [
        { nombre:   { [Op.iLike]: `%${q}%` } },
        { apellido: { [Op.iLike]: `%${q}%` } },
        // documento puede ser INT o TEXT
        literal(`CAST("documento" AS TEXT) ILIKE '%${safeQ}%'`)
      ];
    }

    const result = await Beneficiario.findAndCountAll({
      where,
      order: [["fecha_ingreso", "DESC"]],
      offset: (Number(page)-1) * Number(limit),
      limit: Number(limit),
    });

    res.json({
      total: result.count,
      items: result.rows,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error listando beneficiarios" });
  }
};  
/** GET /api/beneficiarios/:id */
export const obtener = async (req, res) => {
  try {
    const b = await Beneficiario.findOne({
      where: { id_beneficiario: req.params.id, estado: true },
    });
    if (!b) return res.status(404).json({ message: "No encontrado" });
    res.json(b);
  } catch (err) {
    console.error("obtener beneficiario:", err);
    res.status(500).json({ message: "Error buscando beneficiario" });
  }
};

export const crearBeneficiario = async (req, res) => {
  try {
    const {
      nombre, apellido, sexo = "H", documento,
      fecha_nacimiento, nacionalidad,
      fecha_ingreso, motivo_ingreso, programa,
      telefono, direccion,
      emerg_nombre, emerg_parentesco, emerg_telefono,
      alergias, enfermedades, medicamentos, discapacidad,
      ocupacion, observaciones,
    } = req.body;

    if (!nombre || !apellido) {
      return res.status(400).json({ message: "Nombre y apellido son obligatorios" });
    }
    if (!["H","M"].includes(sexo)) {
      return res.status(400).json({ message: "Sexo inválido (H/M)" });
    }

    const b = await Beneficiario.create({
      nombre, apellido, sexo, documento,
      fecha_nacimiento, nacionalidad,
      fecha_ingreso, motivo_ingreso, programa,
      telefono, direccion,
      emerg_nombre, emerg_parentesco, emerg_telefono,
      alergias, enfermedades, medicamentos, discapacidad,
      ocupacion, observaciones,
    });

    res.status(201).json(b);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error creando beneficiario" });
  }
};

export const actualizarBeneficiario = async (req, res) => {
  try {
    const { id } = req.params;
    const b = await Beneficiario.findByPk(id);
    if (!b) return res.status(404).json({ message: "No encontrado" });

    const payload = { ...req.body };
    if (payload.sexo && !["H","M"].includes(payload.sexo)) {
      return res.status(400).json({ message: "Sexo inválido (H/M)" });
    }

    await b.update(payload);
    res.json(b);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error actualizando beneficiario" });
  }
};

/** DELETE /api/beneficiarios/:id  (soft delete) */
export const eliminar = async (req, res) => {
  try {
    const b = await Beneficiario.findByPk(req.params.id);
    if (!b || !b.estado) return res.status(404).json({ message: "No encontrado" });

    await b.update({ estado: false });
    res.json({ ok: true });
  } catch (err) {
    console.error("eliminar beneficiario:", err);
    res.status(500).json({ message: "Error eliminando beneficiario" });
  }
};
