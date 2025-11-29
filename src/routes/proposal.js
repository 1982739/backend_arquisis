const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');

router.post('/create', proposalController.createProposal);
router.get('/', proposalController.getProposals);

module.exports = router;