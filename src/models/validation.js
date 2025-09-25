'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Validation extends Model {};
  Validation.init({
    validation_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    request_id: { type: DataTypes.UUID, allowNull: false },
    status: { type: DataTypes.STRING },
    reason: { type: DataTypes.STRING },
    timestamp: { type: DataTypes.STRING }
  }, { sequelize, modelName: 'validation' });
  return Validation;
};
