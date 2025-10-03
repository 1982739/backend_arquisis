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

async function manageValidationCallback(req, res) {
  try {
    const { request_id, status, reason } = req.body;
    if (!request_id || !status) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const request_info = await Request.findOne({ where: { request_id } });
    if (!request_info) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (status === "REJECTED") {
      await propertie.increment("visit", { 
        by: 1, 
        where: { id: request_info.property_id } 
      });
      console.log(`La solicitud ${request_id} ha sido rechazada por: ${reason}`);
    } else if (status === "ACCEPTED") {
      // descontar dinero a usuario
      console.log(`La solicitud ${request_id} ha sido aceptada`);
    }

    return res.status(200).json({ message: "Callback procesado correctamente" });
  } catch (err) {
    console.error("Error en manageValidationCallback:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}


module.exports = { listValidations, manageValidationCallback };
