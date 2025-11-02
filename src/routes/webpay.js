const express = require('express');
const router = express.Router();
const webpayController = require('../controllers/webpayController');
const { checkJwt } = require("../middleware/auth");
router.post('/create', checkJwt ,webpayController.initiateTransaction);
router.post('/commit', webpayController.confirmTransaction);
router.get('/list', webpayController.listTransactions);

module.exports = router;
