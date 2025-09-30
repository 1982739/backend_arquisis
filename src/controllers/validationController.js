const { validation: Validation } = require("../models");
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

async function manageValidationCallback(data) {
  try {
    const { request_id, status, reason } = data;
    // Aquí puedes manejar la lógica de la respuesta de validación
    console.log(`Request ID: ${request_id}, Status: ${status}, Reason: ${reason}`);
  } catch (err) {
    console.error(err);
  }
}

module.exports = { listValidations, manageValidationCallback };
