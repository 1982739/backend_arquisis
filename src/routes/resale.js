const express = require('express');
const router = express.Router();
const resaleController = require('../controllers/resaleController');
const { checkJwt } = require("../middleware/auth"); // Si quieres proteger la compra

router.get('/available', resaleController.getAvailableResales); // Público: Cualquiera ve ofertas
router.post('/buy', checkJwt, resaleController.buyResale);      // Privado: Solo usuarios compran

module.exports = router;