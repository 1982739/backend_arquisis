const mqtt = require("mqtt");
const axios = require("axios");
require("dotenv").config();

const { MQTT_URL, MQTT_USER, MQTT_PASS, MQTT_TOPIC } = process.env;

const options = {
  username: MQTT_USER,
  password: MQTT_PASS,
  reconnectPeriod: 2000,
};

startMQTT();

function startMQTT() {
  const client = mqtt.connect(MQTT_URL, options);

  client.on("connect", () => {
    console.log("Conectado al broker MQTT");
    client.subscribe(MQTT_TOPIC, (err) => {
      if (err) {
        console.error("Error al suscribirse:", err);
      } else {
        console.log(`Suscrito al topic: ${MQTT_TOPIC}`);
      }
    });
  });

  client.on("message", async (topic, message) => {
    console.log("Mensaje recibido:", message.toString());
    let data;
    try {
      data = JSON.parse(message.toString());
    } catch (err) {
      console.warn("Mensaje no es JSON válido:", err.message);
      return;
    }

    if (!data.url) {
      console.warn("Mensaje recibido sin campo 'url':", data);
      return;
    }

    try {
      const API_URL = process.env.API_URL || "http://api:3000"; 

      const res = await axios.get(`${API_URL}/properties?url=${encodeURIComponent(data.url)}`);
      const existing = Array.isArray(res.data) ? res.data[0] : null;
      if (existing) {
        const currentVisit = existing.visit || 0;
        await axios.put(`${API_URL}/properties/${existing.id}`, {
          visit: currentVisit + 1,
        });
        console.log("Propiedad actualizada:", existing.name);
      } else {
        data.visit = 1;
        const created = await axios.post(`${API_URL}/properties`, data);
        console.log("Nueva propiedad creada:", created.data.name);
      }

    } catch (err) {
      console.warn("Error al procesar mensaje:", err.message);
    }
  });

  client.on("error", (err) => {
    console.error("Error en cliente MQTT:", err);
  });
}
