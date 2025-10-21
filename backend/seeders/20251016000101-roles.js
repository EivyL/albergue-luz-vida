// ESM migration: export default { up, down }
export default {
    async up(queryInterface, Sequelize) {
      // ===== roles =====
      await queryInterface.createTable("roles", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(50), allowNull: false, unique: true },
        descripcion: { type: Sequelize.STRING(200) },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      });
  
      // ===== modulos =====
      await queryInterface.createTable("modulos", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        clave: { type: Sequelize.STRING(60), allowNull: false, unique: true }, // slug: 'beneficiarios', 'usuarios', etc.
        nombre: { type: Sequelize.STRING(100), allowNull: false },
        descripcion: { type: Sequelize.STRING(200) },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      });
  
      // ===== permisos por rol+módulo =====
      await queryInterface.createTable("role_modulos", {
        role_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "roles", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        modulo_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "modulos", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        can_create: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        can_read: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        can_update: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        can_delete: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      });
  
      await queryInterface.addConstraint("role_modulos", {
        fields: ["role_id", "modulo_id"],
        type: "unique",
        name: "ux_role_modulo",
      });
  
      // ===== usuarios =====
      await queryInterface.createTable("usuarios", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: Sequelize.STRING(120), allowNull: false },
        correo: { type: Sequelize.STRING(150), allowNull: false, unique: true },
        contrasena: { type: Sequelize.STRING(255), allowNull: false },
        rol_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "roles", key: "id" },
          onUpdate: "CASCADE",
          onDelete: "RESTRICT",
        },
        activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        ultimo_login: { type: Sequelize.DATE },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      });
  
      // ===== beneficiarios =====
      await queryInterface.createTable("beneficiarios", {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        dpi: { type: Sequelize.STRING(20) },
        nombre: { type: Sequelize.STRING(120), allowNull: false },
        apellido: { type: Sequelize.STRING(120), allowNull: false },
        fecha_nacimiento: { type: Sequelize.DATEONLY },
        telefono: { type: Sequelize.STRING(25) },
        direccion: { type: Sequelize.STRING(200) },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      });
  
      // Índices útiles
      await queryInterface.addIndex("beneficiarios", ["dpi"], { name: "ix_beneficiarios_dpi" });
    },
  
    async down(queryInterface) {
      await queryInterface.removeIndex("beneficiarios", "ix_beneficiarios_dpi");
      await queryInterface.dropTable("beneficiarios");
      await queryInterface.dropTable("usuarios");
      await queryInterface.dropTable("role_modulos");
      await queryInterface.dropTable("modulos");
      await queryInterface.dropTable("roles");
    },
  };
  