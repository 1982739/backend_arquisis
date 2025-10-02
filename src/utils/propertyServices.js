const {propertie} = require("../models");

async function updatePropertyInternal(propertyId, updateData) {
    const property = await propertie.findByPk(propertyId);
    if (!property) throw new Error("Property not found");
    return await property.update(updateData);
}

module.exports = {updatePropertyInternal}