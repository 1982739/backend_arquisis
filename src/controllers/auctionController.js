const { Auction, Proposal } = require('../models');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const LISTENER_URL = process.env.LISTENER_URL || 'http://listener:4000';

const auctionController = {
  // Este se mantiene igual (Maneja la entrada de datos del Listener)
  receiveWebhook: async (req, res) => {
    const data = req.body;
    console.log("📥 [API] Webhook recibido:", data.operation);

    try {
      if (data.operation === 'offer') {
        await Auction.findOrCreate({
          where: { id: data.auction_id },
          defaults: {
            group_id: data.group_id,
            property_url: data.url,
            quantity: data.quantity,
            type: 'offer',
            active: true
          }
        });
        console.log("✅ Oferta guardada en BD");
      } else if (data.operation === 'proposal') {
        const parentAuction = await Auction.findByPk(data.auction_id);
        if (parentAuction) {
          await Proposal.findOrCreate({
            where: { id: data.proposal_id },
            defaults: {
              auction_id: data.auction_id,
              group_id: data.group_id,
              property_url: data.url,
              quantity: data.quantity,
              status: 'pending'
            }
          });
          console.log("✅ Propuesta guardada en BD");
        }
      }
      res.status(200).json({ message: "Datos procesados" });
    } catch (error) {
      console.error("❌ Error en webhook:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Crear Subasta (Solo Auctions)
  createAuction: async (req, res) => {
    const { url, quantity } = req.body;
    let rawGroupId = process.env.GROUP_ID || "21";
    if (typeof rawGroupId === 'string' && rawGroupId.startsWith('group_')) {
        rawGroupId = rawGroupId.replace('group_', '');
    }
    const myGroupId = parseInt(rawGroupId);
    const newAuctionId = uuidv4();

    try {
      await Auction.create({
        id: newAuctionId,
        group_id: myGroupId,
        property_url: url,
        quantity: parseInt(quantity),
        type: 'offer',
        active: true
      });

      const mqttMessage = {
        auction_id: newAuctionId,
        proposal_id: "",
        url: url,
        timestamp: new Date().toISOString(),
        quantity: parseInt(quantity),
        group_id: myGroupId,
        operation: "offer"
      };

      await axios.post(`${LISTENER_URL}/request`, {
        topic: process.env.MQTT_AUCTIONS_TOPIC || "properties/auctions",
        message: mqttMessage
      });

      res.status(201).json({ message: "Subasta creada", auction_id: newAuctionId });
    } catch (error) {
      console.error("Error creando subasta:", error);
      res.status(500).json({ error: "Error interno" });
    }
  },

  getAllAuctions: async (req, res) => {
    try {
      const auctions = await Auction.findAll({ order: [['createdAt', 'DESC']] });
      res.status(200).json(auctions);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener subastas" });
    }
  }
};

module.exports = auctionController;