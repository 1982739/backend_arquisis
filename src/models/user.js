'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here, por ejemplo:
      // User.hasMany(models.propertie, { foreignKey: 'ownerId' });
    }
  }

  User.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    auth0_id: { type: DataTypes.STRING, unique: true, allowNull: false }, // sub del JWT
    email: { type: DataTypes.STRING, allowNull: false },
    name: DataTypes.STRING,
    wallet: { type: DataTypes.INTEGER, defaultValue: 0 } // cantidad inicial en wallet
  }, {
    sequelize,
    modelName: 'User',
  });

  return User;
};
