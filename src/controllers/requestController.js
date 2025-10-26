const { request: Request, propertie } = require("../models");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const { propertyservices } = require("../utils/propertyServices.js");
const { requestservices } = require("../utils/requestServices.js");

async function sendRequest(newRequest) {
  try {
    console.log("📡 Enviando request al listener...");

    const response = await axios.post(
      "http://listener:4000/request",
      {
        topic: process.env.MQTT_REQUEST_TOPIC || "properties/requests",
        message: {
          request_id: newRequest.request_id,
          group_id: newRequest.group_id,
          timestamp: newRequest.timestamp,
          url: newRequest.url,
          origin: newRequest.origin,
          operation: newRequest.operation,
          deposit_token: newRequest.deposit_token || null
        }
      },
      { timeout: 15000 }
    );

    console.log("✅ Request enviado correctamente al listener:", response.status);
  } catch (error) {
    console.error("❌ Error enviando request al listener:", error.message);
  }
}

async function createRequest(req, res) {
  try {
    console.log("➡️ Iniciando createRequest con params:", req.params);

    const property = await propertie.findByPk(req.params.id);
    console.log("✅ Property encontrada:", property?.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const deposit_token = req.body?.deposit_token || null;
    console.log("💾 deposit_token recibido:", deposit_token);

    const newRequest = await Request.create({
      request_id: uuidv4(),
      property_id: property.id,
      group_id: process.env.GROUP_ID,
      url: property.url,
      origin: 0,
      operation: "BUY",
      deposit_token,
      status: "pending",
      timestamp: new Date().toISOString()
    });

    console.log("✅ Request creado en DB con id:", newRequest.request_id);

    await sendRequest(newRequest);
    console.log("📤 Request enviado al listener");

    await propertyservices.updatePropertyInternal(property.id, {
      visit: property.visit - 1
    });
    console.log("🔁 Property actualizada correctamente");

    res.status(201).json(newRequest);
    console.log("✅ Respuesta enviada al cliente");
  } catch (err) {
    console.error("❌ Error en createRequest:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function reciveRequest(req, res) {
  try {
    const { request_id, group_id, origin, operation, timestamp, url, deposit_token } = req.body;

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
      deposit_token: deposit_token || null,
      status: "pending",
      timestamp
    });

    console.log("📥 Solicitud recibida del listener:", req.body);

    await propertyservices.updatePropertyInternal(property.id, {
      visit: property.visit - 1
    });

    return res.status(201).json(newRequest);
  } catch (err) {
    console.error("❌ Error en reciveRequest:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function listRequests(req, res) {
  try {
    const requests = await Request.findAll({ include: propertie });
    res.json(requests);
  } catch (err) {
    console.error("❌ Error en listRequests:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { createRequest, listRequests, reciveRequest };
