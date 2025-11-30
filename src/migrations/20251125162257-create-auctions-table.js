'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Auctions', {
      id: {
        type: Sequelize.UUID, // El auction_id del enunciado
        primaryKey: true,
        allowNull: false
      },
      group_id: {
        type: Sequelize.INTEGER, // Quién hace la oferta
        allowNull: false
      },
      property_url: {
        type: Sequelize.STRING, // Url de la propiedad ofrecida
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER, // Cantidad de visitas
        allowNull: false
      },
      type: {
        type: Sequelize.STRING, // "offer"
        defaultValue: 'offer'
      },
      active: {
        type: Sequelize.BOOLEAN, // Para saber si sigue disponible
        defaultValue: true
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
    await queryInterface.dropTable('Auctions');
  }
};