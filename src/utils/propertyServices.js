const {propertie} = require("../models");

async function updatePropertyInternal(propertyId, updateData) {
    const property = await propertie.findByPk(propertyId);
    if (!property) throw new Error("Property not found");
    return await property.update(updateData);
}


async function findPropertyById(id) {
  const property = await propertie.findByPk(id);
  if (!property) {
    return null; // retornamos null si no existe
  }
  return property;
}

async function getPropertyById(id) {
  const property = await propertie.findByPk(id);
  if (!property) {
    return null; // retornamos null si no existe
  }
  return property;
}
module.exports = {propertyservices: {updatePropertyInternal, findPropertyById, getPropertyById}}