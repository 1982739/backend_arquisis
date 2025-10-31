const express = require("express");
const mqtt = require("mqtt");
const axios = require("axios");
require("dotenv").config();

const { MQTT_URL, MQTT_USER, MQTT_PASS, MQTT_INFO_TOPIC, MQTT_VALIDATION_TOPIC, MQTT_REQUEST_TOPIC } = process.env;

const options = {
    username: MQTT_USER,
    password: MQTT_PASS,
    reconnectPeriod: 2000,
};


const client = mqtt.connect(MQTT_URL, options);

client.on("connect", () => {
    console.log("✅ Conectado al broker MQTT");
    client.subscribe([MQTT_INFO_TOPIC, MQTT_VALIDATION_TOPIC, MQTT_REQUEST_TOPIC], (err) => {
        if (err) {
            console.error("❌ Error al suscribirse:", err);
        } else {
            console.log(`✅ Suscrito a los topics: ${MQTT_INFO_TOPIC}, ${MQTT_VALIDATION_TOPIC}, ${MQTT_REQUEST_TOPIC}`);
        }
    });
});

client.on("error", (err) => {
    console.error("❌ ERROR CRÍTICO MQTT:", err.message);
});

client.on("message", async (topic, message) => {
    

    let data;
    try {
        data = JSON.parse(message.toString());
    } catch (err) {
        console.warn("⚠️ Mensaje no es JSON válido:", err.message);
        return;
    }
    //spam
    if (data.group_id === "16" || data.group_id === "14" || data.group_id === "grupo-XX" || data.group_id === "12" || data.group_id === "04") {
        return
    }
    console.log(`📡 Mensaje MQTT recibido en ${topic}:`, message.toString());
    switch (topic) {
        case MQTT_INFO_TOPIC:
            console.log("➡️ Procesando mensaje de INFO:", data.url);
            if (!data.url) {
                console.warn("⚠️ Mensaje recibido sin campo 'url':", data);
                return;
            }

            try {
                const API_URL = process.env.API_URL || "http://api:3000"; 
                const res = await axios.get(`${API_URL}/properties?url=${encodeURIComponent(data.url)}`);
                const existing = Array.isArray(res.data) ? res.data[0] : null;

                if (existing) {
                    const currentVisit = existing.visit || 0;
                    await axios.put(`${API_URL}/properties/${existing.id}`, { visit: currentVisit + 1 });
                    console.log("✅ Propiedad actualizada:", existing.name);
                } else {
                    data.visit = 1;
                    const created = await axios.post(`${API_URL}/properties`, data);
                    console.log("✅ Nueva propiedad creada:", created.data.name);
                }
            } catch (err) {
                console.warn("❌ Error al procesar mensaje de INFO:", err.message);
            }
            break;
        case MQTT_REQUEST_TOPIC:
            //mientras broker esta colapsado solo procesar grupo 17
            if (data.group_id !== process.env.GROUP_ID) {
                return;
            }
            console.log("➡️ Procesando mensaje de REQUEST (de otro grupo):", data.request_id);
            if (data.group_id === process.env.GROUP_ID) {
                console.log("⚠️ Request de este mismo grupo, no se procesa:", data.request_id);
                return;
            }
            try{
                const API_URL = process.env.API_URL || "http://api:3000";
                const propertyId = await axios.get(`${API_URL}/properties/url/${encodeURIComponent(data.url)}`);
                
                if (!propertyId.data || propertyId.data.length === 0) {
                    console.warn("⚠️ No se encontró la propiedad para la URL:", data.url);
                    return;
                }
                
                const response = await axios.post(`${API_URL}/recive/request`, data);
                console.log("✅ Request registrado con éxito en API:", response.data.request_id);
                
            }catch(err){
                if (err.response) {
                    console.error("❌ Error al registrar request en API:", {
                        status: err.response.status,
                        data: err.response.data,
                    });
                } else if (err.request) {
                    console.error("❌ No hubo respuesta del servidor de request:", err.message);
                } else {
                    console.error("❌ Error inesperado en request:", err.message);
                }
            }
            break;
        case MQTT_VALIDATION_TOPIC:
            //mientras broker esta colapsado solo procesar grupo 17
          
            console.log("➡️ Procesando mensaje de VALIDACIÓN:", data.request_id);

            try {
                const API_URL = process.env.API_URL || "http://api:3000";
                await new Promise((resolve) => setTimeout(resolve, 2000));
                const response = await axios.post(`${API_URL}/managevalidation`, data);

                console.log("✅ Validación registrada con éxito en API:", response.data);
            } catch (err) {
                if (err.response) {
                    console.error("❌ Error al registrar validación en API:", {
                        status: err.response.status,
                        data: err.response.data,
                    });
                } else if (err.request) {
                    console.error("❌ No hubo respuesta del servidor de validación:", err.message);
                } else {
                    console.error("❌ Error inesperado en validación:", err.message);
                }
            }
            break;
        default:
            console.warn("⚠️ Topic no reconocido:", topic);
    }
});


/* publisher (HTTP API) */ 
const app = express();
app.use(express.json());

app.post("/request", (req, res) => {
    console.log("🎉 Petición HTTP /request RECIBIDA desde API:", req.body.topic || 'sin topic');

    const { topic, message } = req.body;
    if (!topic || !message) {
        console.error("❌ Error 400: Faltan topic o message en la petición HTTP.");
        return res.status(400).json({ error: "Falta topic o message" });
    }

    client.publish(topic, JSON.stringify(message), (err) => {
        if (err) {
            console.error("❌ Error al publicar en MQTT:", err.message);
            return res.status(500).json({ error: err.message });
        }
        
        console.log(`✅ Publicado en ${topic}. Enviando respuesta HTTP 200 al API.`);
        res.json({ status: "ok", topic });
    });
});

const PORT = process.env.LISTENER_PORT || 4000;
app.listen(PORT, () => {
    console.log(`🔥 Listener HTTP escuchando en puerto ${PORT}`);
});