// backend/controllers/stats.controller.js
import sequelize from "../config/db.js";
import { QueryTypes } from "sequelize";

// helper: detecta nombres reales de columnas en 'inventario'
async function detectInventarioCols() {
  const cols = await sequelize.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name='inventario'`,
    { type: QueryTypes.SELECT }
  );
  const names = cols.map(c => c.column_name);

  // posibles nombres para cantidad/stock y mínimo
  const qtyCol = ["stock","cantidad","existencias","stock_actual","qty","cantidad_actual"]
    .find(n => names.includes(n));
  const minCol = ["stock_minimo","minimo","min","min_stock","cantidad_minima"]
    .find(n => names.includes(n));

  return { qtyCol, minCol, hasTable: cols.length > 0 };
}

export const overview = async (req, res) => {
  try {
    // KPIs base (sin inventario_bajo)
    const [kpis] = await sequelize.query(`
      SELECT
        (SELECT COUNT(*) FROM camas)                                         AS camas_totales,
        (SELECT COUNT(*) FROM camas WHERE estado = 'OCUPADA')               AS camas_ocupadas,
        (SELECT COUNT(*) FROM camas WHERE estado = 'LIBRE')                 AS camas_libres,
        (SELECT COUNT(*) FROM beneficiarios WHERE estado = true)            AS beneficiarios_activos,
        (SELECT COUNT(*) FROM usuarios      WHERE estado = true)            AS usuarios_activos,
        COALESCE((
          SELECT SUM(ci.subtotal) FROM compras c
          LEFT JOIN compra_items ci ON ci.id_compra = c.id_compra
          WHERE c.estado = true
            AND date_trunc('month', c.fecha) = date_trunc('month', now())
        ), 0)::numeric                                                      AS compras_monto_mes,
        (SELECT COUNT(*) FROM compras c
          WHERE c.estado = true
            AND date_trunc('month', c.fecha) = date_trunc('month', now())
        )                                                                   AS compras_ordenes_mes
    `, { type: QueryTypes.SELECT });

    // inventario_bajo (dinámico según columnas)
    let inventario_bajo = 0;
    let inventarioBajoTop = [];
    const inv = await detectInventarioCols();
    if (inv.hasTable && inv.qtyCol && inv.minCol) {
      const [{ cnt }] = await sequelize.query(
        `SELECT COUNT(*)::int AS cnt FROM inventario WHERE ${inv.qtyCol} <= ${inv.minCol}`,
        { type: QueryTypes.SELECT }
      );
      inventario_bajo = cnt;

      inventarioBajoTop = await sequelize.query(
        `SELECT nombre AS item, ${inv.qtyCol} AS stock, ${inv.minCol} AS stock_minimo
         FROM inventario
         WHERE ${inv.qtyCol} <= ${inv.minCol}
         ORDER BY (${inv.qtyCol} - ${inv.minCol}) ASC
         LIMIT 10`,
        { type: QueryTypes.SELECT }
      );
    }

    // (si quieres luego añadir ocupación7d / compras6m, aquí van)
    res.json({
      kpis: { ...kpis, inventario_bajo },
      charts: { ocupacion7d: [], compras6m: [] },
      tables: { inventarioBajoTop }
    });
  } catch (e) {
    console.error("❌ /stats/overview:", e);
    res.status(500).json({ message: "Error al cargar estadísticas" });
  }
};
