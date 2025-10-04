const express = require("express");
const router = express.Router();
const validationController = require("../controllers/validationController");


router.get("/validation", validationController.listValidations);
router.post("/managevalidation", validationController.manageValidationCallback);

module.exports = router;
