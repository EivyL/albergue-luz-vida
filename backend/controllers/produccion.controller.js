// backend/controllers/produccion.controller.js
import { Op } from "sequelize";
import db from "../config/db.js";
import Produccion from "../Models/Produccion.js";
import ProduccionDetalle from "../Models/ProduccionDetalle.js";
import Inventario from "../Models/Inventario.js";

async function aplicarInventario(detalles, t) {
  for (const d of detalles) {
    const nombre = d.producto;
    const cant = Number(d.cantidad) || 0;

    let row = await Inventario.findOne({ where: { nombre_producto: nombre }, transaction: t });
    if (!row) {
      // Si no existe, crea. Si es CONSUMO y no existe, queda en 0 y no permite negativo.
      row = await Inventario.create({
        nombre_producto: nombre,
        cantidad: 0,
        unidad_medida: d.unidad || null,
      }, { transaction: t });
    }

    if (d.tipo === "CONSUMO") {
      const nueva = Number(row.cantidad) - cant;
      if (nueva < 0) throw new Error(`Stock insuficiente para ${nombre}`);
      await row.update({ cantidad: nueva }, { transaction: t });
    } else if (d.tipo === "PRODUCTO") {
      const nueva = Number(row.cantidad) + cant;
      await row.update({ cantidad: nueva }, { transaction: t });
    }
  }
}

export const listar = async (req, res) => {
  try {
    const { q = "", desde, hasta, page = 1, limit = 20 } = req.query;
    const where = { estado: true };
    if (q) where.responsable = { [Op.iLike]: `%${q}%` };
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha[Op.gte] = desde;
      if (hasta) where.fecha[Op.lte] = hasta;
    }

    const result = await Produccion.findAndCountAll({
      where,
      order: [["id_produccion", "DESC"]],
      offset: (Number(page) - 1) * Number(limit),
      limit: Number(limit),
      include: [{ model: ProduccionDetalle, as: "detalles" }],
    });

    res.json({
      total: result.count,
      items: result.rows,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error listando producciones" });
  }
};

export const obtener = async (req, res) => {
  try {
    const p = await Produccion.findOne({
      where: { id_produccion: req.params.id, estado: true },
      include: [{ model: ProduccionDetalle, as: "detalles" }],
    });
    if (!p) return res.status(404).json({ message: "No encontrada" });
    res.json(p);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error obteniendo producción" });
  }
};

export const crear = async (req, res) => {
  const t = await db.transaction();
  try {
    const { fecha, responsable, observaciones, consumo = [], productos = [] } = req.body;
    if (!fecha) { await t.rollback(); return res.status(400).json({ message: "La fecha es requerida" }); }

    // Normaliza arrays
    const detConsumo = (Array.isArray(consumo) ? consumo : []).map(it => ({
      tipo: "CONSUMO",
      producto: it.producto,
      cantidad: Number(it.cantidad) || 0,
      unidad: it.unidad || null,
    })).filter(it => it.producto && it.cantidad > 0);

    const detProducto = (Array.isArray(productos) ? productos : []).map(it => ({
      tipo: "PRODUCTO",
      producto: it.producto,
      cantidad: Number(it.cantidad) || 0,
      unidad: it.unidad || null,
    })).filter(it => it.producto && it.cantidad > 0);

    if (detConsumo.length === 0 && detProducto.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "Agrega al menos un consumo o producto" });
    }

    const nueva = await Produccion.create({
      fecha,
      responsable: responsable || null,
      observaciones: observaciones || null,
      estado: true,
    }, { transaction: t });

    const detalles = [...detConsumo, ...detProducto];
    for (const d of detalles) {
      await ProduccionDetalle.create({ ...d, id_produccion: nueva.id_produccion }, { transaction: t });
    }

    await aplicarInventario(detalles, t);

    await t.commit();
    const creada = await Produccion.findOne({
      where: { id_produccion: nueva.id_produccion },
      include: [{ model: ProduccionDetalle, as: "detalles" }],
    });
    res.status(201).json(creada);
  } catch (e) {
    console.error(e);
    await t.rollback();
    const msg = e.message?.includes("Stock insuficiente") ? e.message : "Error creando producción";
    res.status(500).json({ message: msg });
  }
};

export const eliminar = async (req, res) => {
  try {
    const p = await Produccion.findByPk(req.params.id);
    if (!p || !p.estado) return res.status(404).json({ message: "No encontrada" });
    await p.update({ estado: false });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error eliminando producción" });
  }
};
