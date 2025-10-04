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
  console.log("Conectado al broker MQTT");
  client.subscribe([MQTT_INFO_TOPIC, MQTT_VALIDATION_TOPIC, MQTT_REQUEST_TOPIC], (err) => {
    if (err) {
      console.error("Error al suscribirse:", err);
    } else {
      console.log(`Suscrito a los topics: ${MQTT_INFO_TOPIC}, ${MQTT_VALIDATION_TOPIC}, ${MQTT_REQUEST_TOPIC}`);
    }
  });
});

client.on("message", async (topic, message) => {
  console.log(`Mensaje recibido en ${topic}:`, message.toString());

  let data;
  try {
    data = JSON.parse(message.toString());
  } catch (err) {
    console.warn("Mensaje no es JSON válido:", err.message);
    return;
  }

  switch (topic) {
    //Recibir información de nuevas propiedades
    case MQTT_INFO_TOPIC:
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
          await axios.put(`${API_URL}/properties/${existing.id}`, { visit: currentVisit + 1 });
          console.log("Propiedad actualizada:", existing.name);
        } else {
          data.visit = 1;
          const created = await axios.post(`${API_URL}/properties`, data);
          console.log("Nueva propiedad creada:", created.data.name);
        }
      } catch (err) {
        console.warn("Error al procesar mensaje:", err.message);
      }
      break;
    //Escuchar request hechas por otros grupos
    case MQTT_REQUEST_TOPIC:
      console.log("Procesando mensaje de request:", data);
      console.log(data);
      try{
        const API_URL = process.env.API_URL || "http://api:3000";
         if (data.group_id === process.env.GROUP_ID) {
          console.log("Request de este mismo grupo, no se procesa:", data);
          return;
        }
        // Obtener el ID de la propiedad a partir de la URL
        const propertyId = await axios.get(`${API_URL}/properties/url/${encodeURIComponent(data.url)}`);
        // Si no tengo la propiedad, no hago nada
        if (!propertyId.data || propertyId.data.length === 0) {
          console.warn("No se encontró la propiedad para la URL:", data.url);
          return;
        }
        
        //Si tengo la propiedad, llamo API para crear el request
        const response = await axios.post(`${API_URL}/recive/request`, data);
        console.log("Request registrado con éxito:", response.data);
          
      }catch(err){
        if (err.response) {
          console.error("Error al registrar request:", {
            status: err.response.status,
            data: err.response.data,
          });
        } else if (err.request) {
          console.error("No hubo respuesta del servidor de request:", err.message);
        } else {
          console.error("Error inesperado en request:", err.message);
        }
      }
      break;
    //Escuchar respuestas de validación, para mis requests y de los demás
    case MQTT_VALIDATION_TOPIC:
      console.log("Procesando mensaje de validación:", data);

      try {
        const API_URL = process.env.API_URL || "http://api:3000";
        const response = await axios.post(`${API_URL}/managevalidation`, data);

        console.log("Validación registrada con éxito:", response.data);
      } catch (err) {
        if (err.response) {
          // Error de la API (código 4xx o 5xx)
          console.error("Error al registrar validación:", {
            status: err.response.status,
            data: err.response.data,
          });
        } else if (err.request) {
          // No hubo respuesta del servidor
          console.error("No hubo respuesta del servidor de validación:", err.message);
        } else {
          // Otro tipo de error
          console.error("Error inesperado en validación:", err.message);
        }
      }
      break;
    

    default:
      console.warn("Topic no reconocido:", topic);
  }
});


/* publisher */ 
//Escuchar a API para realizar request en canal
const app = express();
app.use(express.json());

app.post("/request", (req, res) => {
  const { topic, message } = req.body;
  if (!topic || !message) return res.status(400).json({ error: "Falta topic o message" });

  client.publish(topic, JSON.stringify(message), (err) => {
  if (err) {
    console.error("Error al publicar:", err.message);
    return res.status(500).json({ error: err.message });
  }
  console.log(`Mensaje publicado en ${topic}:`, message);
  res.json({ status: "ok", topic });
  });
});

const PORT = process.env.LISTENER_PORT || 4000;
app.listen(PORT, () => {
  console.log(`Listener HTTP escuchando en puerto ${PORT}`);
});