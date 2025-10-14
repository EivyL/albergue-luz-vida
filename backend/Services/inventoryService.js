import { Op, fn, col, where } from "sequelize";
import { db as sequelize, InventarioItem, InventarioMovimiento } from "../Models/index.js";

export async function listItems(area, q = "") {
  const filtroNombre = q
    ? where(fn("LOWER", col("nombre")), { [Op.like]: `%${q.toLowerCase()}%` })
    : undefined;

  return InventarioItem.findAll({
    where: { area, activo: true, ...(filtroNombre && { nombre: filtroNombre }) },
    order: [["nombre", "ASC"]],
  });
}

export async function createItem(area, payload) {
  const {
    nombre, categoria, unidad = "unidad",
    perishable = false, fechaCaducidad, ubicacion, minStock = 0,
    talla, color, estado
  } = payload;
  if (!nombre) throw new Error("nombre es requerido");

  return InventarioItem.create({
    area,
    nombre,
    categoria,
    unidad,
    perishable,
    fecha_caducidad: fechaCaducidad || null,
    ubicacion,
    min_stock: minStock,
    talla, color, estado,
  });
}

export async function updateItem(id, payload) {
  const it = await InventarioItem.findByPk(id);
  if (!it) throw new Error("Ítem no encontrado");

  const {
    nombre, categoria, unidad, perishable, fechaCaducidad, ubicacion, minStock, activo,
    talla, color, estado
  } = payload;

  await it.update({
    ...(nombre !== undefined && { nombre }),
    ...(categoria !== undefined && { categoria }),
    ...(unidad !== undefined && { unidad }),
    ...(perishable !== undefined && { perishable }),
    ...(fechaCaducidad !== undefined && { fecha_caducidad: fechaCaducidad }),
    ...(ubicacion !== undefined && { ubicacion }),
    ...(minStock !== undefined && { min_stock: minStock }),
    ...(activo !== undefined && { activo }),
    ...(talla !== undefined && { talla }),
    ...(color !== undefined && { color }),
    ...(estado !== undefined && { estado }),
  });

  return it;
}

export async function aplicarMovimiento(area, itemId, { tipo, cantidad, motivo, referencia }, usuarioId) {
  const t = await sequelize.transaction();
  try {
    const item = await InventarioItem.findByPk(itemId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!item) throw new Error("Ítem no encontrado");
    if (item.area !== area) throw new Error("El ítem no pertenece al área indicada");

    let delta = 0;
    if (tipo === "INGRESO") delta = +cantidad;
    else if (tipo === "EGRESO") delta = -Math.abs(cantidad);
    else if (tipo === "AJUSTE") delta = +cantidad;
    else throw new Error("tipo inválido");

    const nuevo = item.stock + delta;
    if (nuevo < 0) throw new Error("Stock insuficiente");

    await item.update({ stock: nuevo }, { transaction: t });

    const mov = await InventarioMovimiento.create({
      item_id: item.id,
      area,
      tipo,
      cantidad: Math.abs(cantidad),
      motivo: motivo || null,
      referencia: referencia || null,
      usuario_id: usuarioId || null,
    }, { transaction: t });

    await t.commit();
    return { item, mov };
  } catch (e) {
    await t.rollback();
    throw e;
  }
}

export async function listMovimientos(area, { itemId, limit = 50 }) {
  const whereMov = { area, ...(itemId && { item_id: itemId }) };
  return InventarioMovimiento.findAll({
    where: whereMov,
    include: [{ model: InventarioItem, as: "item", attributes: ["id", "nombre", "unidad"] }],
    order: [["fecha", "DESC"]],
    limit: Number(limit),
  });
}

export async function exportCSV(area) {
  const items = await InventarioItem.findAll({
    where: { area, activo: true },
    order: [["nombre", "ASC"]],
  });

  const headers = [
    "ID","Nombre","Categoría","Unidad","Stock","Mínimo","Ubicación",
    "Talla","Color","Estado","Perecedero","Caducidad"
  ];
  const rows = items.map(it => [
    it.id, it.nombre, it.categoria || "", it.unidad || "",
    it.stock, it.min_stock, it.ubicacion || "",
    it.talla || "", it.color || "", it.estado || "",
    it.perishable ? "Sí" : "No", it.fecha_caducidad || ""
  ]);

  const lines = [headers, ...rows].map(r =>
    r.map(v => {
      const s = String(v ?? "");
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(";")
  );

  return lines.join("\n");
}

export async function exportHTML(area, titulo) {
  const items = await InventarioItem.findAll({
    where: { area, activo: true },
    order: [["nombre", "ASC"]],
  });

  const filas = items.map(it => `
    <tr>
      <td>${it.id}</td>
      <td>${it.nombre}</td>
      <td>${it.categoria || ""}</td>
      <td>${it.unidad || ""}</td>
      <td style="text-align:right">${it.stock}</td>
      <td style="text-align:right">${it.min_stock}</td>
      <td>${it.ubicacion || ""}</td>
      <td>${it.talla || ""}</td>
      <td>${it.color || ""}</td>
      <td>${it.estado || ""}</td>
      <td>${it.perishable ? "Sí" : "No"}</td>
      <td>${it.fecha_caducidad || ""}</td>
    </tr>
  `).join("");

  return `<!doctype html>
<html><head>
<meta charset="utf-8"><title>${titulo}</title>
<style>
  body{ font-family: Arial, sans-serif; padding:16px; }
  h1{ margin:0 0 12px 0 }
  table{ border-collapse: collapse; width:100%; }
  th, td{ border:1px solid #ddd; padding:6px; }
  th{ background:#f3f3f3; }
  .meta{ margin-bottom:12px; color:#555; font-size:12px }
  @media print { button{ display:none } }
</style>
</head><body>
  <button onclick="window.print()">Imprimir</button>
  <h1>${titulo}</h1>
  <div class="meta">Generado: ${new Date().toLocaleString()}</div>
  <table>
    <thead>
      <tr>
        <th>ID</th><th>Nombre</th><th>Categoría</th><th>Unidad</th>
        <th>Stock</th><th>Mínimo</th><th>Ubicación</th>
        <th>Talla</th><th>Color</th><th>Estado</th>
        <th>Perecedero</th><th>Caducidad</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>
</body></html>`;
}
