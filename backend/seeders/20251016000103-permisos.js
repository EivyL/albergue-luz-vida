'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const [roles]   = await queryInterface.sequelize.query('SELECT id, nombre FROM roles');
    const [modulos] = await queryInterface.sequelize.query('SELECT id, clave  FROM modulos');

    const idRol = (nombre) => roles.find(r => r.nombre === nombre)?.id;
    const idMod = (clave)  => modulos.find(m => m.clave  === clave )?.id;

    const now = new Date();
    const adminId = idRol('admin');
    const coordId = idRol('coordinador');
    const opId    = idRol('operador');

    const all = modulos.map(m => ({
      role_id: adminId, modulo_id: m.id,
      can_create: true, can_read: true, can_update: true, can_delete: true,
      created_at: now, updated_at: now
    }));

    const coord = [
      // coordinador con CRUD en beneficiarios, lectura en usuarios/roles/reportes
      { role_id: coordId, modulo_id: idMod('beneficiarios'), can_create: true, can_read: true, can_update: true, can_delete: false, created_at: now, updated_at: now },
      { role_id: coordId, modulo_id: idMod('usuarios'),      can_create: false, can_read: true, can_update: false, can_delete: false, created_at: now, updated_at: now },
      { role_id: coordId, modulo_id: idMod('roles'),         can_create: false, can_read: true, can_update: false, can_delete: false, created_at: now, updated_at: now },
      { role_id: coordId, modulo_id: idMod('reportes'),      can_create: false, can_read: true, can_update: false, can_delete: false, created_at: now, updated_at: now },
      { role_id: coordId, modulo_id: idMod('dashboard'),     can_create: false, can_read: true, can_update: false, can_delete: false, created_at: now, updated_at: now }
    ];

    const operador = [
      { role_id: opId, modulo_id: idMod('beneficiarios'), can_create: true, can_read: true, can_update: true, can_delete: false, created_at: now, updated_at: now },
      { role_id: opId, modulo_id: idMod('dashboard'),     can_create: false, can_read: true, can_update: false, can_delete: false, created_at: now, updated_at: now }
    ];

    await queryInterface.bulkInsert('role_modulos', [...all, ...coord, ...operador]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('role_modulos', null);
  }
};
