'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class propertie extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  propertie.init({
    name: DataTypes.STRING,
    price: DataTypes.FLOAT,
    currency: DataTypes.STRING,
    bedrooms: DataTypes.STRING,
    m2: DataTypes.STRING,
    location: DataTypes.STRING,
    img: DataTypes.STRING,
    url: DataTypes.STRING,
    is_project: DataTypes.BOOLEAN,
    timestamp: DataTypes.STRING,
    visit: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'propertie',
  });
  return propertie;
};