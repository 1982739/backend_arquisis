const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');
const { requireAdmin } = require('../middleware/requireAdmin');

router.post('/create', requireAdmin, proposalController.createProposal);
router.get('/', requireAdmin, proposalController.getProposals);

module.exports = router;