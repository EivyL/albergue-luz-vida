// backend/controllers/compra.controller.js
import { Op } from "sequelize";
import db from "../config/db.js";
import Compra from "../Models/Compra.js";
import CompraItem from "../Models/CompraItem.js";

// OPCIONAL: integrar con Inventario (si existe)
import Inventario from "../Models/Inventario.js";

/** --------- Helpers --------- **/

// Devuelve YYYY-MM-DD (hoy)
const hoy = () => new Date().toISOString().slice(0, 10);

// Intenta resolver nombres de producto -> id_inventario
async function resolverProductoIds(items) {
  // nombres que vienen sin producto_id
  const nombres = Array.from(
    new Set(
      items
        .map(it => (it.producto_id ? null : (it.producto ?? "").toString().trim()))
        .filter(Boolean)
    )
  );
  const mapa = new Map();
  if (nombres.length === 0) return mapa;

  // Soporta esquemas con 'nombre' o 'nombre_producto'
  const encontrados = await Inventario.findAll({
    where: {
      [Op.or]: [
        { nombre: { [Op.in]: nombres } },
        { nombre_producto: { [Op.in]: nombres } },
      ],
    },
    attributes: ["id_inventario", "nombre", "nombre_producto"],
  });

  for (const r of encontrados) {
    const key = (r.nombre ?? r.nombre_producto)?.toString().trim();
    if (key) mapa.set(key, r.id_inventario);
  }
  return mapa;
}

/** --------- Rutas --------- **/

export const listar = async (req, res) => {
  try {
    const { q = "", page = 1, limit = 20, desde, hasta } = req.query;

    const where = { estado: true };

    // Si q es numérico, filtra por proveedor_id
    const qNum = Number(q);
    if (q && !Number.isNaN(qNum)) where.proveedor_id = qNum;

    // Rango de fechas (opcional)
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha[Op.gte] = desde;
      if (hasta) where.fecha[Op.lte] = hasta;
    }

    const result = await Compra.findAndCountAll({
      where,
      order: [["id_compra", "DESC"]],
      offset: (Number(page) - 1) * Number(limit),
      limit: Number(limit),
      include: [
        { model: CompraItem, as: "items" } // asegúrate de que la asociación y alias coincidan
      ],
    });

    res.json({
      total: result.count,
      items: result.rows,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (e) {
    console.error("listar compras:", e);
    res.status(500).json({ message: "Error listando compras" });
  }
};

export const obtener = async (req, res) => {
  try {
    const c = await Compra.findOne({
      where: { id_compra: req.params.id, estado: true },
      include: [{ model: CompraItem, as: "items" }],
    });
    if (!c) return res.status(404).json({ message: "No encontrada" });
    res.json(c);
  } catch (e) {
    console.error("obtener compra:", e);
    res.status(500).json({ message: "Error obteniendo compra" });
  }
};

export const crear = async (req, res) => {
  try {
    const { proveedor_id, fecha, items = [] } = req.body;

    // --- Validaciones mínimas ---
    // Si NO quieres exigir proveedor_id, comenta las 2 líneas siguientes:
    const pid = Number(proveedor_id);
    if (!pid) return res.status(400).json({ message: "Seleccione un proveedor válido (id numérico)" });

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Debe agregar al menos un ítem" });
    }

    const fechaISO = fecha ? String(fecha) : hoy();

    // Resolver nombres -> ids (si vienen nombres)
    const mapaNombreAId = Inventario ? await resolverProductoIds(items) : new Map();

    // Normalizar items
    const norm = items.map((it, idx) => {
      // Acepta: producto_id | id_producto | id_inventario | producto(nombre)
      let producto_id = Number(it.producto_id || it.id_producto || it.id_inventario || 0);
      if (!producto_id && it.producto) {
        const byName = mapaNombreAId.get((it.producto || "").toString().trim());
        if (byName) producto_id = Number(byName);
      }
      if (!producto_id) {
        throw new Error(`Item ${idx + 1}: 'producto_id' es requerido (o 'producto' debe existir en Inventario)`);
      }

      const cantidad = Number(it.cantidad ?? 0);
      const precio   = Number(it.precio ?? it.precio_unitario ?? 0);
      if (!(cantidad > 0)) throw new Error(`Item ${idx + 1}: cantidad debe ser > 0`);
      if (!(precio   >= 0)) throw new Error(`Item ${idx + 1}: precio debe ser >= 0`);

      const subtotal = +(cantidad * precio).toFixed(2);
      const producto = it.producto ? String(it.producto) : null; // nombre libre opcional

      return { producto_id, producto, cantidad, precio, subtotal };
    });

    const total = norm.reduce((acc, it) => acc + Number(it.subtotal), 0);

    // Transacción: compra + items
    const compra = await db.transaction(async (t) => {
      const c = await Compra.create(
        { proveedor_id: pid, fecha: fechaISO, total, estado: true },
        { transaction: t }
      );

      for (const it of norm) {
        await CompraItem.create(
          { ...it, id_compra: c.id_compra },
          { transaction: t }
        );
      }

      // Si quieres actualizar inventario (sumar existencias por compra),
      // implementa aquí la lógica de stock sobre tu modelo Inventario.
      // await aplicarEnInventario(norm, t);

      return c;
    });

    res.status(201).json({ ok: true, id_compra: compra.id_compra, total });
  } catch (e) {
    console.error("crear compra:", e);
    res.status(500).json({ message: e.message || "Error creando compra" });
  }
};

export const eliminar = async (req, res) => {
  try {
    const c = await Compra.findByPk(req.params.id);
    if (!c || !c.estado) return res.status(404).json({ message: "No encontrada" });
    await c.update({ estado: false });
    res.json({ ok: true });
  } catch (e) {
    console.error("eliminar compra:", e);
    res.status(500).json({ message: "Error eliminando compra" });
  }
};
