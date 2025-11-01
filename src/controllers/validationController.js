const { validation: Validation } = require("../models");
const { requestservices } = require("../utils/requestServices.js");
const { propertyservices } = require("../utils/propertyServices.js");
const axios = require("axios");
async function listValidations(req, res) {
  try {
    const validations = await Validation.findAll();
    res.json(validations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function create_boleta(compra) {
  try {
    const response = await axios.post(process.env.BOLETA_LAMBDA_URL, compra, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error creando boleta:", error.message);
    throw error;
  }
}

async function manageValidationCallback(req, res) {
  try {

    //llamar lambda para creaccion de boleta
        // const boleta_info = await create_boleta({
        //     property_name: "propiedad de prueba",
        //     property_url: "http://propiedad-de-prueba.com",
        //     property_address: "Dirección de prueba",
        //     buyer_id: "buyer-123",
        //     group_id: "group-123",
        //     request_id: "request-123",
        //     amount: 100,
        //     purchase_date: new Date().toISOString(),
        // });
        // console.log("Boleta creada exitosamente:", boleta_info);
    console.log("paso 1");
    const { request_id, status, reason } = req.body;
    if (!request_id || !status) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }
    // buscar info de la request
    console.log("paso 2");
    const request_info = await requestservices.getRequestByRequestId(request_id);
    if (!request_info) {
      return res.status(404).json({ error: "Request not found" });
    }
    console.log("request info:", request_info);
    console.log("paso 3");
    // buscar propiedad asociada a la request
    const property = await propertyservices.getPropertyByUrl(request_info.url);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (status === "REJECTED") {
      //Se devuelve la visita que había sido descontada por reserva
      const newVisit = property.visit < 0 ? 0 : property.visit + 1;
      await propertyservices.updatePropertyInternal(property.id, { visit: newVisit });
      await requestservices.updateRequestStatus(request_id, "REJECTED");

      console.log(`La solicitud ${request_id} ha sido rechazada por: ${reason}`);

    } else if (status === "ACCEPTED") {
      // if (property.visit < 0) {
      //   await propertyservices.updatePropertyInternal(property.id, { visit: 0 });
      // }
      console.log("property info:", property);
      console.log("paso 4");
      await requestservices.updateRequestStatus(request_id, "ACCEPTED");
      if (request_info.group_id === process.env.GROUP_ID) {
         // lógica para descontar dinero, SOLUCIONAR QUE SE RECIBA EL AUTH0 TOKEN
        console.log("paso 5");
        //await requestservices.chargeUserForRequest(request_info.user_id, property.price);
        console.log(`La solicitud ${request_id} ha sido aceptada`);

        console.log("paso 6");
    //llamar lambda para creaccion de boleta
        const amount_reservation = property.price * 0.1;
        const boleta_info = await create_boleta({
            property_name: property.name,
            property_url: property.url,
            property_address: property.location,
            buyer_id: request_info.auth0_id || "unknown",
            group_id: request_info.group_id,
            request_id: request_info.request_id,
            amount: amount_reservation,
            purchase_date: new Date().toISOString(),
        });
        console.log("Boleta creada exitosamente:", boleta_info);
        if (boleta_info) {
          await requestservices.updateRequestWithBoletaInfo(request_id, boleta_info);        
        }
      }
     
    }
   
    

    return res.status(200).json({ message: "Callback procesado correctamente" });
  } catch (err) {
    console.error("Error en manageValidationCallback:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { listValidations, manageValidationCallback };
