const { validation: Validation } = require("../models");
const axios = require("axios");
const requestController = require("./requestController.js");
const propertyController = require("./propertyController.js");
const { requestservices } = require("../utils/requestServices.js");
const { propertyservices } = require("../utils/propertyServices.js");
async function listValidations(req, res) {
  try {
    const validations = await Validation.findAll();
    res.json(validations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function manageValidationCallback(data) {
  try {
    const { request_id, status, reason } = data;
    // Aquí puedes manejar la lógica de la respuesta de validación
    console.log(`Request ID: ${request_id}, Status: ${status}, Reason: ${reason}`);
    const request_info = await requestservices.getRequestByRequestId(request_id);
    if (status === "REJECTED") {
      const property_id = request_info.property_id;
      await propertyservices.updatePropertyInternal(property_id, { visit: request_info.visit + 1 });
      console.log(`La solicitud ${request_id} ha sido rechazada por: ${reason}`);
    }
    else if (status === "ACCEPTED") {
      //descontar dinero a usuario
    }

  } catch (err) {
    console.error(err);
  }
}

module.exports = { listValidations, manageValidationCallback };
