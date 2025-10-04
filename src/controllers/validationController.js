const { validation: Validation } = require("../models");
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
    // buscar info de la request
    const request_info = await requestservices.getRequestByRequestId(request_id);
    if (!request_info) {
      return res.status(404).json({ error: "Request not found" });
    }
    const property = await propertyservices.getPropertyById(request_info.property_id);
    if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
    if (status === "REJECTED") {
      const newVisit = property.visit < 0 ? 0 : property.visit + 1;
      await propertyservices.updatePropertyInternal(property.id, { visit: newVisit });
      await requestservices.updateRequestStatus(request_id, "REJECTED");

      console.log(`La solicitud ${request_id} ha sido rechazada por: ${reason}`);
    } else if (status === "ACCEPTED") {
      if (property.visit < 0) {
        await propertyservices.updatePropertyInternal(property.id, { visit: 0 });
      }
      await requestservices.updateRequestStatus(request_id, "ACCEPTED");
      // lógica para descontar dinero
      console.log(`La solicitud ${request_id} ha sido aceptada`);
    }

    return res.status(200).json({ message: "Callback procesado correctamente" });
  } catch (err) {
    console.error("Error en manageValidationCallback:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { listValidations, manageValidationCallback };
