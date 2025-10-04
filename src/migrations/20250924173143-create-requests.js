'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('requests', {
      request_id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      property_id: { type: Sequelize.INTEGER, allowNull: false },
      group_id: { type: Sequelize.STRING, allowNull: false },
      url: { type: Sequelize.STRING, allowNull: false }, 
      origin: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 }, 
      operation: { type: Sequelize.ENUM('BUY'), allowNull: false, defaultValue: 'BUY' }, 
      status: { type: Sequelize.ENUM('pending','ACCEPTED','REJECTED','OK','error'), defaultValue: 'pending' },
      reason: { type: Sequelize.STRING },
      timestamp: { type: Sequelize.STRING, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('requests');
  }
};
