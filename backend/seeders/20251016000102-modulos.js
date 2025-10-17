'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('modulos', [
      { clave: 'dashboard',      nombre: 'Dashboard',      descripcion: 'Inicio',            created_at: now, updated_at: now },
      { clave: 'beneficiarios',  nombre: 'Beneficiarios',  descripcion: 'Gestión de fichas', created_at: now, updated_at: now },
      { clave: 'usuarios',       nombre: 'Usuarios',       descripcion: 'Gestión de usuarios', created_at: now, updated_at: now },
      { clave: 'roles',          nombre: 'Roles',          descripcion: 'Roles y permisos',  created_at: now, updated_at: now },
      { clave: 'reportes',       nombre: 'Reportes',       descripcion: 'Reportes y export', created_at: now, updated_at: now }
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('modulos', { clave: ['dashboard','beneficiarios','usuarios','roles','reportes'] });
  }
};
