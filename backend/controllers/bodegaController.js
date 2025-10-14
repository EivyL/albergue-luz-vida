// backend/controllers/bodegaController.js
import * as svc from "../Services/inventoryService.js";

export async function listItems(req, res) {
  try {
    const items = await svc.listItems("BODEGA", req.query.q);
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error al listar bodega" });
  }
}

export async function createItem(req, res) {
  try {
    const it = await svc.createItem("BODEGA", req.body);
    res.status(201).json(it);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
}

export async function updateItem(req, res) {
  try {
    const it = await svc.updateItem(req.params.id, req.body);
    res.json(it);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
}

export async function aplicarMovimiento(req, res) {
  try {
    const { tipo, cantidad, motivo, referencia } = req.body;
    const usuarioId = req.user?.id || req.headers["x-user-id"] || null;
    const out = await svc.aplicarMovimiento(
      "BODEGA",
      req.params.id,
      { tipo, cantidad, motivo, referencia },
      Number(usuarioId)
    );
    res.status(201).json({ ok: true, ...out });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
}

export async function listMovimientos(req, res) {
  try {
    const items = await svc.listMovimientos("BODEGA", req.query);
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error al listar movimientos" });
  }
}

export async function exportCSV(req, res) {
  try {
    const csv = await svc.exportCSV("BODEGA");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="bodega_inventario.csv"');
    res.send(csv);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "No se pudo exportar" });
  }
}

export async function exportHTML(req, res) {
  try {
    const html = await svc.exportHTML("BODEGA", "Inventario — Bodega");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "No se pudo exportar" });
  }
}
