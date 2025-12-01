'use strict';
const { Model, Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Auction extends Model {
        static associate(models) {
            Auction.hasMany(models.Proposal, {foreignKey: 'auction_id', as: 'proposals', onDelete: 'CASCADE' });
        }
    }

    Auction.init({
    id: {type: DataTypes.UUID, primaryKey: true,allowNull: false},
    group_id: {type: DataTypes.INTEGER, allowNull: false},
    property_url: {type: DataTypes.STRING, allowNull: false},
    quantity: {type: DataTypes.INTEGER, allowNull: false},
    type: {type: DataTypes.STRING, defaultValue: 'offer'},
    active: {type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    sequelize,
    modelName: 'Auction',
    tableName: 'Auctions',
  });

  return Auction;
};
