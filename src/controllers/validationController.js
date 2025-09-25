const { validation: Validation } = require("../models");

async function listValidations(req, res) {
  try {
    const validations = await Validation.findAll();
    res.json(validations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { listValidations };
