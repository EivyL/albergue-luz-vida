// backend/controllers/stats.controller.js
import sequelize from "../config/db.js";

const scalar = async (sql) => {
  const [rows] = await sequelize.query(sql);
  const v = rows?.[0] ? Object.values(rows[0])[0] : 0;
  return Number(v ?? 0);
};

const tableExists = async (table) => {
  const [rows] = await sequelize.query(
    `SELECT to_regclass('public.${table}') IS NOT NULL AS ok;`
  );
  return !!rows?.[0]?.ok;
};

const colExists = async (table, col) => {
  const [rows] = await sequelize.query(
    `SELECT EXISTS(
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema='public' AND table_name='${table}' AND column_name='${col}'
     ) AS ok;`
  );
  return !!rows?.[0]?.ok;
};

export const overview = async (_req, res) => {
  try {
    // ---- Camas ----
    let camas_totales = 0,
      camas_ocupadas = 0,
      camas_libres = 0;

    if (await tableExists("camas")) {
      camas_totales = await scalar(`SELECT COUNT(*) FROM camas`);

      if (await colExists("camas", "estado")) {
        camas_ocupadas = await scalar(
          `SELECT COUNT(*) FROM camas WHERE estado='OCUPADA'`
        );
        camas_libres = await scalar(
          `SELECT COUNT(*) FROM camas WHERE estado='LIBRE'`
        );
      } else if (await colExists("camas", "ocupada")) {
        camas_ocupadas = await scalar(
          `SELECT COUNT(*) FROM camas WHERE ocupada=true`
        );
        camas_libres = Math.max(camas_totales - camas_ocupadas, 0);
      }
    }

    // ---- Beneficiarios ----
    const beneficiarios_activos = await scalar(
      (await tableExists("beneficiarios"))
        ? (await colExists("beneficiarios", "estado"))
          ? `SELECT COUNT(*) FROM beneficiarios WHERE estado=true`
          : `SELECT COUNT(*) FROM beneficiarios`
        : `SELECT 0`
    );

    // ---- Usuarios ----
    const usuarios_activos = await scalar(
      (await tableExists("usuarios"))
        ? (await colExists("usuarios", "activo"))
          ? `SELECT COUNT(*) FROM usuarios WHERE activo=true`
          : (await colExists("usuarios", "estado"))
          ? `SELECT COUNT(*) FROM usuarios WHERE estado=true`
          : `SELECT COUNT(*) FROM usuarios`
        : `SELECT 0`
    );

    // ---- Compras ----
    let compras_monto_mes = 0,
      compras_ordenes_mes = 0;

    if (await tableExists("compras")) {
      const haveFecha = await colExists("compras", "fecha");
      if (haveFecha) {
        const haveEstado = await colExists("compras", "estado");
        const whereEstado = haveEstado ? `c.estado = true AND` : ``;

        compras_monto_mes = await scalar(`
          SELECT COALESCE(SUM(ci.subtotal),0)
          FROM compras c
          LEFT JOIN compra_items ci ON ci.id_compra = c.id_compra
          WHERE ${whereEstado} date_trunc('month', c.fecha) = date_trunc('month', now())
        `);

        compras_ordenes_mes = await scalar(`
          SELECT COUNT(*)
          FROM compras c
          WHERE ${whereEstado} date_trunc('month', c.fecha) = date_trunc('month', now())
        `);
      }
    }

    return res.json({
      camas_totales,
      camas_ocupadas,
      camas_libres,
      beneficiarios_activos,
      usuarios_activos,
      compras_monto_mes,
      compras_ordenes_mes,
    });
  } catch (err) {
    console.error("❌ /stats/overview:", err);
    // Devuelve ceros para no romper el home
    return res.json({
      camas_totales: 0,
      camas_ocupadas: 0,
      camas_libres: 0,
      beneficiarios_activos: 0,
      usuarios_activos: 0,
      compras_monto_mes: 0,
      compras_ordenes_mes: 0,
    });
  }
};
