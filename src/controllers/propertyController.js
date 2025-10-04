const {propertie} = require("../models");
const {Op} = require("sequelize");

async function getProperties(req, res)  {
    try{
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const offset = (page - 1) * limit;

        const {price, location, date, url} = req.query;
        const filters = {};
        if (price) filters.price = {[Op.lte]: price};
        if (location) filters.location = { [Op.iLike]: `%${location}%` };
        if (url) filters.url = url;
        if (date) {
            const start = new Date(date);
            start.setUTCHours(0, 0, 0, 0); 

            const end = new Date(date);
            end.setUTCHours(23, 59, 59, 999);

            filters.timestamp = {
                [Op.between]: [start.toISOString(), end.toISOString()]
            };
        }

        const properties = await propertie.findAndCountAll({
            where: filters,
            order: [['id', 'ASC']],
            limit: limit,
            offset: offset
        });
        res.json(properties.rows);
    }
    catch(err){
        console.error("Error fetching properties:", err);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function getPropertyById(req, res) {
    try{
        const property = await propertie.findByPk(req.params.id);
        if (!property) {
            return res.status(404).json({ error: "Property not found" })}
        res.json(property);
        } catch (err) {
            res.status(500).json({ error: "Error al obtener propiedad" });
        }
    }

async function getPropertyByUrl(req, res) {
    try {
        const property = await propertie.findOne({ where: { url: req.params.url } });
        if (!property) {
            return res.status(404).json({ error: "Property not found" });
        }
        res.json(property);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener propiedad" });
    }
}

async function createProperty(req, res) {
    try {
        const newProperty = await propertie.create(req.body);
        res.status(201).json(newProperty);
    } catch (err) {
        console.error("Error creating property:", err);
        res.status(500).json({ error: "Internal server error" });
    }
}


async function updateProperty(req, res) {
    try {
        const property = await propertie.findByPk(req.params.id);
        if (!property) {
            return res.status(404).json({ error: "Property not found" });
        }
        const updatedProperty = await property.update(req.body);
        res.json(updatedProperty);
    } catch (err) {
        console.error("Error updating property:", err);
        res.status(500).json({ error: "Internal server error" });
    }
}


module.exports = {getProperties, getPropertyById, getPropertyByUrl, createProperty, updateProperty};