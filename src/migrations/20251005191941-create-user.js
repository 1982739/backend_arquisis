'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: { 
        type: Sequelize.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
      },
      auth0_id: { 
        type: Sequelize.STRING, 
        allowNull: false, 
        unique: true 
      },
      email: { 
        type: Sequelize.STRING, 
        allowNull: false 
      },
      name: { 
        type: Sequelize.STRING 
      },
      wallet: { 
        type: Sequelize.INTEGER, 
        defaultValue: 0 
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  }
};
