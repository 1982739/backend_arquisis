const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');
const { requireAdmin } = require('../middleware/requireAdmin');

router.post('/receive', requireAdmin, auctionController.receiveWebhook);
router.post('/create', requireAdmin, auctionController.createAuction);
router.get('/', requireAdmin, auctionController.getAllAuctions);

module.exports = router;