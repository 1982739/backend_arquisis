const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const { WebpayPlus, Options, Environment } = require('transbank-sdk');
const { request: Request, propertie } = require("../models");

async function sendToListener(topic, messageData) {
  try {
    const message = {
      request_id: messageData.request_id || uuidv4(),
      group_id: messageData.group_id || process.env.GROUP_ID,
      timestamp: messageData.timestamp || new Date().toISOString(),
      url: messageData.url || "",
      origin: messageData.origin ?? 0,
      operation: messageData.operation || "UNKNOWN",
      deposit_token: messageData.deposit_token || null,
    };

    console.log("➡️ Enviando al listener:", { topic, message });

    const response = await axios.post(
      "http://listener:4000/request",
      { topic, message },
      { timeout: 15000 }
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


/**
 * 1️⃣ Iniciar transacción Webpay
 * Crea la transacción, guarda Request en DB, y avisa por MQTT
 */
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
    if (property.visit <= 0) {
      return res.status(400).json({ error: "No hay stock disponible" });
    }

    // 🧠 Datos requeridos por Webpay
    const buyOrder = `prop-${property.id}-${uuidv4().slice(0, 8)}`;
    const sessionId = `sess-${uuidv4().slice(0, 8)}`;
    const amount = property.price;
    const returnUrl = process.env.WEBPAY_RETURN_URL;

    console.log("🧭 Datos tx.create:", { buyOrder, sessionId, amount, returnUrl });

    // 🧩 Crear transacción con Webpay
    const response = await tx.create(buyOrder, sessionId, amount, returnUrl);
    console.log("💰 Webpay respuesta:", response);

    // 🧾 Crear Request en DB
    const request_id = uuidv4();
    const newRequest = await Request.create({
      request_id,
      property_id: property.id,
      group_id: group_id || process.env.GROUP_ID,
      url: property.url,
      origin: 0,
      operation: "BUY",
      deposit_token: response.token,
      status: "pending",
      timestamp: new Date().toISOString(),
    });

    // 📡 Avisar al listener (MQTT)
    await sendToListener(process.env.MQTT_REQUEST_TOPIC, {
      request_id,
      group_id: group_id || process.env.GROUP_ID,
      timestamp: new Date().toISOString(),
      url: property.url,
      origin: 0,
      operation: "BUY",
      deposit_token: response.token,
    });

    // 📤 Enviar datos al frontend
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

/**
 * 2️⃣ Confirmar transacción Webpay
 * Confirma el pago (commit), actualiza estado de la propiedad y Request, y avisa al listener
 */
const confirmTransaction = async (req, res) => {
  try {
    const { token_ws } = req.body;
    if (!token_ws) {
      return res.status(400).json({ success: false, message: "Falta token_ws (posible pago cancelado)" });
    }

    // 🧾 Confirmar con Webpay
    const result = await tx.commit(token_ws);
    console.log("💳 Resultado Webpay commit:", result);

    const request = await Request.findOne({ where: { deposit_token: token_ws } });
    let status = "REJECTED";
    let success = false;

    if (result.response_code === 0) {
      success = true;
      status = "ACCEPTED";

      // 🧱 Actualizar Request en DB
      if (request) {
        await request.update({ status: "ACCEPTED" });

        // 🏠 Actualizar propiedad (restar stock)
        const property = await propertie.findByPk(request.property_id);
        if (property && property.visit > 0) {
          await property.update({ visit: property.visit - 1 });
        }
      }
    } else if (request) {
      await request.update({ status: "REJECTED" });
    }

    // 📡 Enviar validación al listener
    await sendToListener(process.env.MQTT_VALIDATION_TOPIC, {
      request_id: request?.request_id || uuidv4(),
      timestamp: new Date().toISOString(),
      status,
      reason: `WebPay: ${result.status}`,
    });

    res.status(200).json({
      success,
      status: result.status,
      response_code: result.response_code,
      message: success ? "Pago confirmado exitosamente" : "Pago rechazado",
      details: result,
    });
  } catch (error) {
    console.error("❌ Error confirmando transacción:", error.message);
    await sendToListener(process.env.MQTT_VALIDATION_TOPIC, {
      request_id: uuidv4(),
      timestamp: new Date().toISOString(),
      status: "ERROR",
      reason: `Error WebPay: ${error.message}`,
    });
    res.status(500).json({ success: false, error: "Error confirmando transacción", details: error.message });
  }
};

/**
 * 3️⃣ Listar transacciones (opcional)
 */
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
