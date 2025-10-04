'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Request extends Model {
    static associate(models) {
      Request.belongsTo(models.propertie, { foreignKey: 'property_id' });
    }
  }
  
  Request.init({
    request_id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
    property_id: { type: DataTypes.INTEGER, allowNull: false },
    group_id: { type: DataTypes.STRING, allowNull: false },
    url: { type: DataTypes.STRING, allowNull: false },
    origin: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    operation: { type: DataTypes.ENUM('BUY'), allowNull: false, defaultValue: 'BUY' },
    status: { type: DataTypes.ENUM('pending','ACCEPTED','REJECTED','OK','error'), defaultValue: 'pending' },
    reason: { type: DataTypes.STRING, allowNull: true },
    timestamp: { type: DataTypes.STRING, allowNull: false }
  }, {
    sequelize,
    modelName: 'request',
  });

  return Request;
};
