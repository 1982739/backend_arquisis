'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Proposals', {
      id: {
        type: Sequelize.UUID, // El proposal_id del enunciado
        primaryKey: true,
        allowNull: false
      },
      auction_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Auctions', // Nombre de la tabla a la que apunta
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Si borras la subasta, se borran las propuestas
      },
      group_id: {
        type: Sequelize.INTEGER, // Quién propone el intercambio
        allowNull: false
      },
      property_url: {
        type: Sequelize.STRING, // Propiedad que ofrecen a cambio
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER, // Cantidad a cambio
        allowNull: false
      },
      status: {
        type: Sequelize.STRING, // pending, accepted, rejected
        defaultValue: 'pending'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Proposals');
  }
};