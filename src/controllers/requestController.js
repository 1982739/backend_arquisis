const { request: Request, propertie } = require("../models");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const { propertyservices } = require("../utils/propertyServices.js");
const { requestservices } = require("../utils/requestServices.js");

async function sendRequest(newRequest) {
    try {
        console.log("➡️ Enviando request al listener para publicar en MQTT:", newRequest.request_id);

        const message = {
            request_id: newRequest.request_id,
            group_id: newRequest.group_id,
            timestamp: newRequest.timestamp,
            url: newRequest.url,
            origin: newRequest.origin,
            operation: newRequest.operation,
            deposit_token: newRequest.deposit_token || null
        };
        
        console.log("📡 Mensaje a publicar (properties/requests):", message);

        const response = await axios.post(
            "http://listener:4000/request",
            {
                topic: process.env.MQTT_REQUEST_TOPIC || "properties/requests",
                message: message
            },
            { timeout: 15000 }
        );

        console.log(`✅ Request publicado correctamente al listener. HTTP Status: ${response.status}`);
    } catch (error) {
        if (error.response) {
            console.error("❌ Error HTTP en Listener al publicar:", {
                status: error.response.status,
                data: error.response.data,
            });
        } else if (error.request) {
            console.error("❌ TIMEOUT/Sin respuesta del Listener:", error.message);
        } else {
            console.error("❌ Error desconocido enviando request al listener:", error.message);
        }
    }
}

async function createRequest(req, res) {
    try {
        console.log("➡️ Iniciando createRequest (Grupo Local) para propiedad:", req.params.id);

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

        await propertyservices.updatePropertyInternal(property.id, {
            visit: property.visit - 1
        });
        console.log("🔁 Property actualizada correctamente (visit - 1)");

        res.status(201).json(newRequest);
        console.log("✅ Proceso createRequest finalizado exitosamente. Respuesta enviada al cliente.");
    } catch (err) {
        console.error("❌ Error crítico en createRequest:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function reciveRequest(req, res) {
    try {
        const { request_id, group_id, origin, operation, timestamp, url, deposit_token } = req.body;
        
        console.log("➡️ Iniciando reciveRequest (Desde Listener) para:", { request_id, group_id, url });

        if ([request_id, group_id, operation, timestamp, url].some(v => !v) || origin === undefined) {
            return res.status(400).json({ error: "Faltan campos requeridos" });
        }

        const property = await propertie.findOne({ where: { url } });
        if (!property) {
            console.warn("No se encontró la propiedad para la URL:", url);
            return res.status(404).json({ error: "Property not found" });
        }
        
        console.log("✅ Propiedad de la request encontrada en DB:", property.id);

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

        console.log("📥 Solicitud recibida y registrada con éxito en DB:", newRequest.request_id);

        await propertyservices.updatePropertyInternal(property.id, {
            visit: property.visit - 1
        });
        console.log("🔁 Property actualizada correctamente (visit - 1)");

        return res.status(201).json(newRequest);
    } catch (err) {
        console.error("❌ Error en reciveRequest (Al procesar mensaje de otro grupo):", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}

async function listRequests(req, res) {
    try {
        const { sub } = req.auth;
        const requests = await Request.findAll({ where: { auth0_id: sub }, include: propertie });
        console.log("✅ Listando requests. Total:", requests.length);
        res.json(requests);
    } catch (err) {
        console.error("❌ Error en listRequests:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

async function getRequestInfoById(req,res) {
  try {
    const request = await Request.findOne({
      where: { request_id: req.params.request_id },
      include: [
        {
          model: propertie,
          as: 'propertie', // usa el alias correcto de tu asociación
        },
      ],
    });
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    res.json(request);
  } catch (err) {
    console.error("Error fetching request info:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}


module.exports = { createRequest, listRequests, reciveRequest, getRequestInfoById };