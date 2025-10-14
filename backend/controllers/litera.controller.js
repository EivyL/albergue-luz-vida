import { Op, Sequelize } from "sequelize";
import sequelize from "../config/db.js";
import Litera from "../Models/Litera.js";
import AsignacionLitera from "../Models/AsignacionLitera.js";
import Beneficiario from "../Models/Beneficiario.js"; // ya existe en tu app

// Helper: arma 3 slots por litera con el ocupante (si hay)
function buildSlotsRow(litera, asignacionesActivas = []) {
  const bySlot = new Map(asignacionesActivas.map(a => [a.slot, a]));
  const slots = [1,2,3].map(n => {
    const a = bySlot.get(n);
    if (!a) return { slot: n, estado: "LIBRE", ocupante: null, tipo: null };
    if (a.tipo !== "OCUPACION") {
      return { slot: n, estado: a.tipo, ocupante: null, asignacion: a };
    }
    const b = a?.beneficiario
      ? { id_beneficiario: a.beneficiario.id_beneficiario, nombre: a.beneficiario.nombre, apellido: a.beneficiario.apellido }
      : null;
    return { slot: n, estado: "OCUPADA", ocupante: b, asignacion: a };
  });
  const libres = slots.filter(s => s.estado === "LIBRE").length;
  return { ...litera.toJSON(), slots, libres, ocupadas: 3 - libres };
}

// GET /api/literas?q=&area=&piso=
export const listar = async (req, res) => {
  try {
    const { q = "", area = "", piso = "" } = req.query;
    const where = { estado: true };
    if (q)    where.codigo = { [Op.iLike]: `%${q}%` };
    if (area) where.area   = { [Op.iLike]: `%${area}%` };
    if (piso) where.piso   = Number(piso);

    const rows = await Litera.findAll({ where, order: [["codigo", "ASC"]] });

    // Trae asignaciones activas por litera (1 query, usando IN)
    const ids = rows.map(r => r.id_litera);
    const asign = await AsignacionLitera.findAll({
      where: { id_litera: { [Op.in]: ids }, estado: "ACTIVA" },
      include: [{ model: Beneficiario, as: "beneficiario", required: false }],
      order: [["id_litera","ASC"],["slot","ASC"]],
    });

    // Indexa por litera
    const byLitera = asign.reduce((acc, a) => {
      (acc[a.id_litera] ||= []).push(a);
      return acc;
    }, {});
    const payload = rows.map(r => buildSlotsRow(r, byLitera[r.id_litera] || []));
    res.json({ items: payload, total: payload.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error listando literas" });
  }
};

// POST /api/literas  { codigo, area?, piso? }
export const crear = async (req, res) => {
  try {
    const { codigo, area, piso } = req.body;
    if (!codigo) return res.status(400).json({ message: "codigo es requerido" });
    const row = await Litera.create({ codigo, area, piso, estado: true });
    res.status(201).json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e?.errors?.[0]?.message || "Error creando litera" });
  }
};

// POST /api/literas/:id/slots/:slot/asignar { id_beneficiario, tipo?='OCUPACION', notas? }
export const asignar = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id_litera = Number(req.params.id);
    const slot      = Number(req.params.slot);
    const { id_beneficiario, tipo = "OCUPACION", notas = null } = req.body;

    if (!(slot >=1 && slot <=3)) return res.status(400).json({ message: "slot inválido" });
    if (tipo === "OCUPACION" && !id_beneficiario) return res.status(400).json({ message: "id_beneficiario requerido" });

    // Cierra si existe una asignación activa en ese slot
    await AsignacionLitera.update(
      { estado: "FINALIZADA", fecha_fin: Sequelize.fn("CURRENT_DATE") },
      { where: { id_litera, slot, estado: "ACTIVA" }, transaction: t }
    );

    const a = await AsignacionLitera.create({
      id_litera, slot, id_beneficiario: id_beneficiario || null, tipo, estado: "ACTIVA", notas
    }, { transaction: t });

    await t.commit();
    res.status(201).json(a);
  } catch (e) {
    await t.rollback();
    console.error(e);
    // si chocamos con la unique (dos clientes a la vez)
    if (e?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "El slot ya fue ocupado" });
    }
    res.status(500).json({ message: "Error asignando slot" });
  }
};

// POST /api/literas/:id/slots/:slot/liberar
export const liberar = async (req, res) => {
  try {
    const id_litera = Number(req.params.id);
    const slot      = Number(req.params.slot);
    const [n] = await AsignacionLitera.update(
      { estado: "FINALIZADA", fecha_fin: Sequelize.fn("CURRENT_DATE") },
      { where: { id_litera, slot, estado: "ACTIVA" } }
    );
    if (!n) return res.status(404).json({ message: "No hay asignación activa" });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error liberando slot" });
  }
};

// POST /api/literas/auto-asignar { id_beneficiario }
export const autoAsignar = async (req, res) => {
  const { id_beneficiario } = req.body;
  if (!id_beneficiario) return res.status(400).json({ message: "id_beneficiario requerido" });

  try {
    // Busca literas con menos de 3 ocupadas, prioriza las más vacías y por código
    const libres = await sequelize.query(`
      SELECT l.id_litera, l.codigo,
             3 - COUNT(a.id_asignacion) AS libres
      FROM literas l
      LEFT JOIN asignaciones_litera a
        ON a.id_litera = l.id_litera AND a.estado='ACTIVA' AND a.tipo='OCUPACION'
      WHERE l.estado = true
      GROUP BY l.id_litera
      HAVING 3 - COUNT(a.id_asignacion) > 0
      ORDER BY libres DESC, l.codigo ASC
      LIMIT 1;
    `, { type: Sequelize.QueryTypes.SELECT });

    if (libres.length === 0) return res.status(409).json({ message: "No hay camas libres" });

    const { id_litera } = libres[0];

    // Encuentra el primer slot libre (1..3)
    const ocup = await AsignacionLitera.findAll({ where: { id_litera, estado: "ACTIVA" } });
    const ocupados = new Set(ocup.map(o => o.slot));
    const slot = [1,2,3].find(s => !ocupados.has(s));

    // Usa el mismo flujo de asignar()
    req.params.id = id_litera;
    req.params.slot = slot;
    req.body.tipo = "OCUPACION";
    return asignar(req, res);

  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error en auto-asignación" });
  }
};
