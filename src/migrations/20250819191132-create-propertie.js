'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('properties', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      price: {
        type: Sequelize.FLOAT
      },
      currency: {
        type: Sequelize.STRING
      },
      bedrooms: {
        type: Sequelize.STRING
      },
      m2: {
        type: Sequelize.STRING
      },
      location: {
        type: Sequelize.STRING
      },
      img: {
        type: Sequelize.STRING
      },
      url: {
        type: Sequelize.STRING
      },
      is_project: {
        type: Sequelize.BOOLEAN
      },
      timestamp: {
        type: Sequelize.STRING
      },
      visit: {
        type: Sequelize.INTEGER
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
    await queryInterface.dropTable('properties');
  }
};