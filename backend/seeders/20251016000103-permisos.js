// ESM seeder: permisos por rol y módulo (role_modulos)
export default {
    up: async (queryInterface, Sequelize) => {
      const t = await queryInterface.sequelize.transaction();
      try {
        const now = new Date();
  
        // 1) Traer roles que vamos a configurar
        const [roles] = await queryInterface.sequelize.query(
          `SELECT id, nombre FROM roles WHERE nombre IN ('Admin','Operador')`,
          { transaction: t }
        );
        const idByRole = Object.fromEntries(roles.map(r => [r.nombre, r.id]));
  
        if (!idByRole.Admin || !idByRole.Operador) {
          throw new Error("Faltan roles 'Admin' y/o 'Operador'. Ejecuta primero el seeder de roles.");
        }
  
        // 2) Traer módulos
        const [mods] = await queryInterface.sequelize.query(
          `SELECT id, clave FROM modulos`,
          { transaction: t }
        );
        const idByMod = Object.fromEntries(mods.map(m => [m.clave, m.id]));
  
        // 3) Política de permisos (ajústala a tu gusto)
        // Si no hay entrada para un módulo, tomará la default.
        const DEFAULT_ADMIN  = { create: true,  read: true,  update: true,  delete: true  };
        const DEFAULT_OPER   = { create: false, read: true,  update: false, delete: false };
  
        const POLICY = {
          Admin:    {}, // vacío → usa todo true
          Operador: {
            // ejemplo: dar update en beneficiarios
            // beneficiarios: { create: false, read: true, update: true, delete: false },
          },
        };
  
        const rows = [];
  
        for (const [modClave, modulo_id] of Object.entries(idByMod)) {
          // Admin
          const a = (POLICY.Admin && POLICY.Admin[modClave]) || DEFAULT_ADMIN;
          rows.push({
            role_id: idByRole.Admin,
            modulo_id,
            can_create: a.create, can_read: a.read, can_update: a.update, can_delete: a.delete,
            created_at: now, updated_at: now,
          });
  
          // Operador
          const o = (POLICY.Operador && POLICY.Operador[modClave]) || DEFAULT_OPER;
          rows.push({
            role_id: idByRole.Operador,
            modulo_id,
            can_create: o.create, can_read: o.read, can_update: o.update, can_delete: o.delete,
            created_at: now, updated_at: now,
          });
        }
  
        await queryInterface.bulkInsert("role_modulos", rows, {
          transaction: t,
          ignoreDuplicates: true, // respeta ux_role_modulo
        });
  
        await t.commit();
      } catch (e) {
        await t.rollback();
        throw e;
      }
    },
  
    down: async (queryInterface, Sequelize) => {
      const t = await queryInterface.sequelize.transaction();
      try {
        // Borra SOLO lo creado por este seeder: permisos de Admin/Operador
        const [[{ admin_id }]] = await queryInterface.sequelize.query(
          `SELECT id as admin_id FROM roles WHERE nombre='Admin' LIMIT 1`, { transaction: t }
        ).catch(() => [[{ admin_id: null }]]);
  
        const [[{ op_id }]] = await queryInterface.sequelize.query(
          `SELECT id as op_id FROM roles WHERE nombre='Operador' LIMIT 1`, { transaction: t }
        ).catch(() => [[{ op_id: null }]]);
  
        if (admin_id) {
          await queryInterface.bulkDelete("role_modulos", { role_id: admin_id }, { transaction: t });
        }
        if (op_id) {
          await queryInterface.bulkDelete("role_modulos", { role_id: op_id }, { transaction: t });
        }
  
        await t.commit();
      } catch (e) {
        await t.rollback();
        throw e;
      }
    },
  };
  