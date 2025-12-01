'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Agregamos la columna 'quantity' a la tabla 'properties'
    await queryInterface.addColumn('properties', 'quantity', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: true // Se permite null temporalmente para no romper datos existentes
    });
  },

  async down (queryInterface, Sequelize) {
    // Si deshacemos la migración, borramos la columna
    await queryInterface.removeColumn('properties', 'quantity');
  }
};