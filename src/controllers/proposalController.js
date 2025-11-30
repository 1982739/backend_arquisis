const { Proposal, Auction } = require('../models');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const LISTENER_URL = process.env.LISTENER_URL || 'http://listener:4000';

const proposalController = {
  // Crear una propuesta (Envía al Broker)
  createProposal: async (req, res) => {
    const { auction_id, property_url, quantity } = req.body;
    
    // Lógica para limpiar el GROUP_ID
    let rawGroupId = process.env.GROUP_ID || "21";
    if (typeof rawGroupId === 'string' && rawGroupId.startsWith('group_')) {
        rawGroupId = rawGroupId.replace('group_', '');
    }
    const myGroupId = parseInt(rawGroupId);
    
    const newProposalId = uuidv4();

    try {
      const targetAuction = await Auction.findByPk(auction_id);

      if (!targetAuction) {
        return res.status(404).json({ error: "La subasta original no se encuentra en la base de datos." });
      }

      // 1. Guardar en BD
      await Proposal.create({
        id: newProposalId,
        auction_id: auction_id,
        group_id: myGroupId,
        property_url: property_url,
        quantity: parseInt(quantity),
        status: 'pending'
      });

      // 2. Preparar mensaje MQTT
      const mqttMessage = {
        auction_id: auction_id,
        proposal_id: newProposalId,
        url: property_url,
        timestamp: new Date().toISOString(),
        quantity: parseInt(quantity),
        group_id: myGroupId,
        operation: "proposal"
      };

      // 3. Enviar al Listener
      await axios.post(`${LISTENER_URL}/request`, {
        topic: process.env.MQTT_AUCTIONS_TOPIC || "properties/auctions",
        message: mqttMessage
      });

      res.status(201).json({
        message: "Propuesta enviada correctamente",
        proposal_id: newProposalId
      });

    } catch (error) {
      console.error("Error creando propuesta:", error);
      res.status(500).json({ error: "Error interno al crear propuesta" });
    }
  },

  // Obtener propuestas (Filtrar por subasta opcional)
  getProposals: async (req, res) => {
    const { auction_id } = req.query;
    try {
      const whereClause = auction_id ? { auction_id } : {};
      const proposals = await Proposal.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
      });
      res.status(200).json(proposals);
    } catch (error) {
      console.error("Error obteniendo propuestas:", error);
      res.status(500).json({ error: "Error al obtener propuestas" });
    }
  }
};

module.exports = proposalController;