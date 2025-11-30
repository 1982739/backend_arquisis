'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Proposal extends Model {
    static associate(models) {
      Proposal.belongsTo(models.Auction, {
        foreignKey: 'auction_id',
        as: 'auction'
      });
    }
  }

  Proposal.init({
    id: {type: DataTypes.UUID, primaryKey: true, allowNull: false},
    auction_id: {type: DataTypes.UUID, allowNull: false},
    group_id: {type: DataTypes.INTEGER, allowNull: false},
    property_url: {type: DataTypes.STRING, allowNull: false},
    quantity: {type: DataTypes.INTEGER, allowNull: false},
    status: {type: DataTypes.STRING, defaultValue: 'pending', allowNull: false}
  }, {
    sequelize,
    modelName: 'Proposal',
    tableName: 'Proposals',
  });

  return Proposal;
};