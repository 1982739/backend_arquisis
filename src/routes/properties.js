const express = require("express");
const router = express.Router()
const propertyController = require("../controllers/propertyController.js");

router.get("/properties", propertyController.getProperties);
router.get("/properties/:id", propertyController.getPropertyById);
router.get("/properties/url/:url", propertyController.getPropertyByUrl);
router.post("/properties", propertyController.createProperty);
router.put("/properties/:id", propertyController.updateProperty);
module.exports = router;