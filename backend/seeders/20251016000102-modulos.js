// ESM seeder: insertar módulos base
export default {
    up: async (queryInterface, Sequelize) => {
      const t = await queryInterface.sequelize.transaction();
      try {
        const now = new Date();
  
        // Ajusta esta lista a tu proyecto
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
          ignoreDuplicates: true, // ON CONFLICT DO NOTHING en PG
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
        await t.commit();
      } catch (e) {
        await t.rollback();
        throw e;
      }
    },
  };
  