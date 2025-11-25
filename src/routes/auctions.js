const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');

router.post('/receive', auctionController.receiveWebhook);
router.post('/create', auctionController.createAuction);
router.get('/', auctionController.getAllAuctions);

module.exports = router;