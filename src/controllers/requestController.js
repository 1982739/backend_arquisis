const { request: Request, propertie } = require("../models");
const { v4: uuidv4 } = require("uuid");
const mqtt = require("mqtt");
const axios = require("axios");
const propertyController = require("./propertyController.js");
const {propertyservices} = require("../utils/propertyServices.js");
const {requestservices} = require("../utils/requestServices.js");
// const client = mqtt.connect(process.env.MQTT_URL, {
//   username: process.env.MQTT_USER,
//   password: process.env.MQTT_PASS
// });
async function sendRequest(newRequest) {
  try {
    await axios.post("http://listener:4000/request", {
      topic: process.env.MQTT_REQUEST_TOPIC || "properties/requests",
      message: {
        request_id: newRequest.request_id,
        group_id: newRequest.group_id,
        timestamp: newRequest.timestamp,
        url: newRequest.url,
        origin: newRequest.origin,
        operation: newRequest.operation
      }
    });
    console.log("Request enviado correctamente");
  } catch (error) {
    console.error("Error enviando request:", error.message);
  }
}


async function createRequest(req, res) {
  try {
    const property = await propertie.findByPk(req.params.id);
    if (!property) return res.status(404).json({ error: "Property not found" });
    
    const newRequest = await Request.create({
      request_id: uuidv4(),
      property_id: property.id,
      group_id: process.env.GROUP_ID,
      url: property.url,
      origin: 0,
      operation: "BUY",
      status: 'pending',
      timestamp: new Date().toISOString()
    });
    // Publicar el mensaje en el broker MQTT
    await sendRequest(newRequest);
   
    await propertyservices.updatePropertyInternal(property.id, { visit: property.visit - 1 });
    
    res.status(201).json(newRequest);
  } catch (err) {
    console.error("Error en createRequest:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function reciveRequest(req, res) {
  try {
    const { request_id, group_id, origin, operation, timestamp, url } = req.body;
    if ([request_id, group_id, operation, timestamp, url].some(v => !v) || origin === undefined) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const property = await propertie.findOne({ where: { url } });
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }
    const newRequest = await Request.create({
      request_id,
      property_id: property.id,
      group_id,
      url: property.url,
      origin,
      operation,
      status: "pending",
      timestamp
    });

    console.log("Solicitud recibida:", req.body);
    
    await propertyservices.updatePropertyInternal(property.id, { visit: property.visit - 1 });
    
    return res.status(201).json(newRequest);

  } catch (err) {
    console.error("Error en reciveRequest:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}



async function listRequests(req, res) {
  try {
    const requests = await Request.findAll({ include: propertie });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}




module.exports = { createRequest, listRequests, reciveRequest };
