'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('roles', [
      { nombre: 'admin',       descripcion: 'Acceso total', created_at: now, updated_at: now },
      { nombre: 'coordinador', descripcion: 'Gestiona módulos clave', created_at: now, updated_at: now },
      { nombre: 'operador',    descripcion: 'Operación diaria', created_at: now, updated_at: now }
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', { nombre: ['admin','coordinador','operador'] });
  }
};
