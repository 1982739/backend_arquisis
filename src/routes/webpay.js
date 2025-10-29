const express = require('express');
const router = express.Router();
const webpayController = require('../controllers/webpayController');

router.post('/create', webpayController.initiateTransaction);
router.post('/commit', webpayController.confirmTransaction);
router.get('/list', webpayController.listTransactions);

module.exports = router;
