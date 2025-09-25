'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Validation extends Model {
    static associate(models) {
      Validation.belongsTo(models.Request, { foreignKey: 'request_id', targetKey: 'request_id' });
    }
  }

  Validation.init({
    request_id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
    timestamp: { type: DataTypes.STRING, allowNull: false }, 
    status: { type: DataTypes.ENUM('ACCEPTED','OK','error','REJECTED'), allowNull: false },
    reason: { type: DataTypes.STRING } 
  }, {
    sequelize,
    modelName: 'validation',
    timestamps: true
  });

  return Validation;
};
