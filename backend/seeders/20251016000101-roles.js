// Carga inicial de roles, módulos y permisos (role_modulos)
// ESM: export default { up, down }
export default {
    up: async (queryInterface, Sequelize) => {
      const t = await queryInterface.sequelize.transaction();
      try {
        const now = new Date();
  
        // 1) Roles base
        const rolesData = [
          { nombre: "Admin",    descripcion: "Administrador", created_at: now, updated_at: now },
          { nombre: "Operador", descripcion: "Operador",      created_at: now, updated_at: now },
        ];
        await queryInterface.bulkInsert("roles", rolesData, {
          transaction: t,
          ignoreDuplicates: true, // Postgres → ON CONFLICT DO NOTHING
        });
  
        // 2) Módulos que usas en el proyecto (ajusta si quieres)
        const modKeys = [
          "usuarios",
          "beneficiarios",
          "produccion",
          "stats",
          "habitaciones",
          "inventario",
          "bodega",
        ];
        const toTitle = s => s.charAt(0).toUpperCase() + s.slice(1);
  
        const modulosData = modKeys.map(k => ({
          clave: k,
          nombre: toTitle(k),
          descripcion: null,
          created_at: now,
          updated_at: now,
        }));
  
        await queryInterface.bulkInsert("modulos", modulosData, {
          transaction: t,
          ignoreDuplicates: true,
        });
  
        // 3) IDs reales de roles y módulos
        const [rolesRows] = await queryInterface.sequelize.query(
          `SELECT id, nombre FROM roles WHERE nombre IN ('Admin','Operador')`,
          { transaction: t }
        );
        const [modsRows] = await queryInterface.sequelize.query(
          `SELECT id, clave FROM modulos WHERE clave IN (${modKeys.map(k => `'${k}'`).join(",")})`,
          { transaction: t }
        );
  
        const idByRole = Object.fromEntries(rolesRows.map(r => [r.nombre, r.id]));
        const idByMod  = Object.fromEntries(modsRows.map(m => [m.clave, m.id]));
  
        // 4) Permisos por rol
        // Admin: todo true
        const adminPerms = modKeys.map(k => ({
          role_id: idByRole.Admin,
          modulo_id: idByMod[k],
          can_create: true,
          can_read:   true,
          can_update: true,
          can_delete: true,
          created_at: now,
          updated_at: now,
        }));
  
        // Operador: solo lectura por defecto (ajusta si necesitas)
        const operPerms = modKeys.map(k => ({
          role_id: idByRole.Operador,
          modulo_id: idByMod[k],
          can_create: false,
          can_read:   true,
          can_update: false,
          can_delete: false,
          created_at: now,
          updated_at: now,
        }));
  
        const roleModulosData = [...adminPerms, ...operPerms];
  
        await queryInterface.bulkInsert("role_modulos", roleModulosData, {
          transaction: t,
          ignoreDuplicates: true, // evita chocar con ux_role_modulo
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
        // elimina solo lo que este seeder insertó
        await queryInterface.bulkDelete("role_modulos", null, { transaction: t });
        await queryInterface.bulkDelete("modulos", {
          clave: [
            "usuarios",
            "beneficiarios",
            "produccion",
            "stats",
            "habitaciones",
            "inventario",
            "bodega",
          ],
        }, { transaction: t });
        await queryInterface.bulkDelete("roles", { nombre: ["Admin","Operador"] }, { transaction: t });
  
        await t.commit();
      } catch (e) {
        await t.rollback();
        throw e;
      }
    },
  };
  