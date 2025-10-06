const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { checkJwt } = require("../middleware/auth");

// Crear usuario si no existe (opcional: al login)
router.post("/users/sync", checkJwt, userController.createUserIfNotExists);

// Consultar wallet
router.get("/users/wallet", checkJwt, userController.getWallet);

// Recargar wallet
router.post("/users/wallet/recharge", checkJwt, userController.rechargeWallet);

module.exports = router;
