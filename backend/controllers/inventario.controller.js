// backend/controllers/inventario.controller.js
import Inventario from "../Models/Inventario.js";

// GET /api/inventario
export const listarInventario = async (req, res) => {
  try {
    const items = await Inventario.findAll({
      order: [["id_inventario", "ASC"]],
    });
    res.json(items);
  } catch (e) {
    console.error("listarInventario error:", e);
    res.status(500).json({ message: "Error listando inventario" });
  }
};

// POST /api/inventario
export const crearItem = async (req, res) => {
  try {
    const { nombre_producto, cantidad = 0, unidad_medida } = req.body;

    if (!nombre_producto || String(nombre_producto).trim() === "") {
      return res.status(400).json({ message: "nombre_producto es requerido" });
    }

    const nuevo = await Inventario.create({
      nombre_producto,
      cantidad: Number(cantidad) || 0,
      unidad_medida: unidad_medida || null,
      id_usuario: req.user?.id || null, // opcional: quién creó
    });

    res.status(201).json(nuevo);
  } catch (e) {
    console.error("crearItem error:", e);
    res.status(500).json({ message: "Error creando item" });
  }
};

// DELETE /api/inventario/:id
export const borrarItem = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await Inventario.destroy({
      where: { id_inventario: id },
    });
    if (!rows) return res.status(404).json({ message: "No existe el item" });
    res.json({ ok: true });
  } catch (e) {
    console.error("borrarItem error:", e);
    res.status(500).json({ message: "Error eliminando item" });
  }
};

// PATCH /api/inventario/:id/ajustar  { delta: number }
export const ajustarCantidad = async (req, res) => {
  try {
    const { id } = req.params;
    const { delta } = req.body;

    const item = await Inventario.findOne({ where: { id_inventario: id } });
    if (!item) return res.status(404).json({ message: "No existe el item" });

    const nuevoValor = (Number(item.cantidad) || 0) + Number(delta || 0);
    if (nuevoValor < 0) {
      return res.status(400).json({ message: "La cantidad no puede ser negativa" });
    }

    item.cantidad = nuevoValor;
    await item.save();

    res.json(item);
  } catch (e) {
    console.error("ajustarCantidad error:", e);
    res.status(500).json({ message: "Error ajustando cantidad" });
  }
};
