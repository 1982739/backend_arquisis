const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const { WebpayPlus, Options, Environment } = require('transbank-sdk');
const { request: Request, propertie } = require("../models");
const { triggerRecommendationJob } = require("../utils/jobmasterClient"); // Import your existing client

async function sendToListener(topic, messageData) {
    try {
        const baseMessage = {
            request_id: messageData.request_id,
            timestamp: messageData.timestamp || new Date().toISOString(),
        };
        let message;
        if (topic === process.env.MQTT_REQUEST_TOPIC) {
            message = {
                ...baseMessage,
                group_id: process.env.GROUP_ID,
                url: messageData.url || "",
                origin: messageData.origin ?? 0,
                operation: messageData.operation || "UNKNOWN",
                deposit_token: messageData.deposit_token || null,
            };
        } else if (topic === process.env.MQTT_VALIDATION_TOPIC) {
            message = {
                ...baseMessage,
                status: messageData.status || "UNKNOWN",
                reason: messageData.reason || "No reason provided",
            };
        } else {
            console.warn(`⚠️ Topic desconocido: ${topic}`);
            return;
        }
        console.log("➡️ Enviando al listener:", { topic, message });

        const response = await axios.post(
            "http://listener:4000/request",
            { topic, message },
        );

        console.log(`✅ Mensaje enviado al listener (${topic}):`, response.status);
    } catch (error) {
        console.error("❌ Error enviando mensaje al listener:", error.message);
    }
}


const tx = new WebpayPlus.Transaction(
    new Options(
        process.env.WEBPAY_COMMERCE_CODE,
        process.env.WEBPAY_API_KEY,
        Environment.Integration
    )
);


const initiateTransaction = async (req, res) => {
    try {
        const { property_id, group_id } = req.body;

        if (!property_id) {
            return res.status(400).json({ error: "Falta property_id" });
        }

        const property = await propertie.findByPk(property_id);
        if (!property) {
            return res.status(404).json({ error: "Property no encontrada" });
        }
        
        const buyOrder = `prop-${property.id}-${uuidv4().slice(0, 8)}`;
        const sessionId = `sess-${uuidv4().slice(0, 8)}`;
        const amount = property.price;
        const returnUrl = process.env.WEBPAY_RETURN_URL;

        console.log("🧭 Datos tx.create:", { buyOrder, sessionId, amount, returnUrl });

        const response = await tx.create(buyOrder, sessionId, amount, returnUrl);
        console.log("💰 Webpay respuesta:", response);

        const request_id = uuidv4();
        const { sub } = req.auth;

        const newRequest = await Request.create({
            request_id: request_id,
            property_id: property.id,
            group_id: process.env.GROUP_ID,
            url: property.url,
            origin: 0,
            operation: "BUY",
            deposit_token: response.token,
            status: "pending",
            auth0_id: sub,
            timestamp: new Date().toISOString(),
        });
        console.log("📝 Nueva request creada:", newRequest.toJSON());

        await sendToListener(process.env.MQTT_REQUEST_TOPIC, {
            request_id: newRequest.request_id,
            group_id: process.env.GROUP_ID,
            timestamp: newRequest.timestamp,
            url: newRequest.url,
            origin: 0,
            operation: "BUY",
            deposit_token: response.token,
        });

        res.status(200).json({
            token: response.token,
            url: response.url,
            buyOrder,
            price: amount,
            message: "Transacción iniciada correctamente",
        });
    } catch (error) {
        console.error("❌ Error iniciando transacción:", error.message);
        res.status(500).json({ error: "Error iniciando transacción", details: error.message });
    }
};

const confirmTransaction = async (req, res) => {
  try {
    const { token_ws } = req.body;
    if (!token_ws) {
      return res.status(400).json({
        success: false,
        message: "Falta token_ws (posible pago cancelado)",
      });
    }

    // 1️⃣ Confirmar pago con WebPay
    const result = await tx.commit(token_ws);
    console.log("💳 Resultado Webpay commit:", result);

    // 2️⃣ Buscar la solicitud correspondiente
    const request = await Request.findOne({
      where: { deposit_token: token_ws },
    });

    let status = "REJECTED";
    let success = false;
    let jobResponse = null;

    // 3️⃣ Pago aprobado
    if (result.response_code === 0) {
      success = true;
      status = "ACCEPTED";

      if (request) {
        await request.update({ status: "ACCEPTED" });

        const property = await propertie.findByPk(request.property_id);
        if (property && property.visit > 0) {
          await property.update({ visit: property.visit - 1 });
        }

        // 🚀 NUEVO: disparar job de recomendación
        try {
          console.log(
            `🚀 Enviando job de recomendación para property ${property.id}, user ${request.group_id}`
          );

          jobResponse = await triggerRecommendationJob(
            property.id,
            request.group_id
          );

          console.log("✅ JobMaster respondió:", jobResponse);
        } catch (err) {
          console.error("⚠️ Error creando job de recomendación:", err.message);
        }
      }
    } else if (request) {
      await request.update({ status: "REJECTED" });
    }

    // 4️⃣ Notificar por MQTT (validación)
    await sendToListener(process.env.MQTT_VALIDATION_TOPIC, {
      request_id: request?.request_id || uuidv4(),
      timestamp: new Date().toISOString(),
      status,
      reason: `WebPay: ${result.status}`,
    });

    // 5️⃣ Responder al frontend
    res.status(200).json({
      success,
      status: result.status,
      response_code: result.response_code,
      message: success
        ? "Pago confirmado exitosamente y recomendaciones en proceso"
        : "Pago rechazado",
      details: result,
      recommendation: jobResponse,
    });
  } catch (error) {
    console.error("❌ Error confirmando transacción:", error.message);
    await sendToListener(process.env.MQTT_VALIDATION_TOPIC, {
      request_id: uuidv4(),
      timestamp: new Date().toISOString(),
      status: "ERROR",
      reason: `Error WebPay: ${error.message}`,
    });

    res.status(500).json({
      success: false,
      error: "Error confirmando transacción",
      details: error.message,
    });
  }
};

const listTransactions = async (req, res) => {
    try {
        const requests = await Request.findAll({
            include: propertie,
            order: [["timestamp", "DESC"]],
        });
        res.json(requests);
    } catch (error) {
        console.error("❌ Error listando transacciones:", error.message);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

module.exports = {
    initiateTransaction,
    confirmTransaction,
    listTransactions,
};