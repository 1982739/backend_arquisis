const { Proposal, Auction } = require('../models');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const LISTENER_URL = process.env.LISTENER_URL || 'http://listener:4000';

const proposalController = {
  // Crear una propuesta (Ya lo tenías)
  createProposal: async (req, res) => {
    const { auction_id, property_url, quantity } = req.body;
    
    let rawGroupId = process.env.GROUP_ID || "21";
    if (typeof rawGroupId === 'string' && rawGroupId.startsWith('group_')) {
        rawGroupId = rawGroupId.replace('group_', '');
    }
    const myGroupId = parseInt(rawGroupId);
    
    const newProposalId = uuidv4();

    try {
      const targetAuction = await Auction.findByPk(auction_id);
      if (!targetAuction) {
        return res.status(404).json({ error: "La subasta original no existe" });
      }

      await Proposal.create({
        id: newProposalId,
        auction_id: auction_id,
        group_id: myGroupId,
        property_url: property_url,
        quantity: parseInt(quantity),
        status: 'pending'
      });

      const mqttMessage = {
        auction_id: auction_id,
        proposal_id: newProposalId,
        url: property_url,
        timestamp: new Date().toISOString(),
        quantity: parseInt(quantity),
        group_id: myGroupId,
        operation: "proposal"
      };

      await axios.post(`${LISTENER_URL}/request`, {
        topic: process.env.MQTT_AUCTIONS_TOPIC || "properties/auctions",
        message: mqttMessage
      });

      res.status(201).json({ message: "Propuesta enviada", proposal_id: newProposalId });

    } catch (error) {
      console.error("Error creando propuesta:", error);
      res.status(500).json({ error: "Error interno" });
    }
  },

  // Obtener propuestas (MEJORADO: Incluye datos de la subasta padre)
  getProposals: async (req, res) => {
    const { auction_id } = req.query;
    try {
      const whereClause = auction_id ? { auction_id } : {};
      
      const proposals = await Proposal.findAll({
        where: whereClause,
        include: [{ model: Auction, as: 'auction' }], // <--- CLAVE PARA EL FRONT
        order: [['createdAt', 'DESC']]
      });
      
      res.status(200).json(proposals);
    } catch (error) {
      console.error("Error obteniendo propuestas:", error);
      res.status(500).json({ error: "Error al obtener propuestas" });
    }
  },

  // NUEVO: Responder a una propuesta (Aceptar/Rechazar)
  respondToProposal: async (req, res) => {
    const { proposal_id, action } = req.body; // action: 'acceptance' | 'rejection'

    if (!['acceptance', 'rejection'].includes(action)) {
        return res.status(400).json({ error: "Acción inválida. Use 'acceptance' o 'rejection'" });
    }

    let rawGroupId = process.env.GROUP_ID || "21";
    if (typeof rawGroupId === 'string') rawGroupId = rawGroupId.replace('group_', '');
    const myGroupId = parseInt(rawGroupId);

    try {
        const proposal = await Proposal.findByPk(proposal_id, {
            include: [{ model: Auction, as: 'auction' }]
        });

        if (!proposal) return res.status(404).json({ error: "Propuesta no encontrada" });

        // Verificación de seguridad: Solo el dueño de la subasta puede responder
        if (proposal.auction.group_id !== myGroupId) {
            return res.status(403).json({ error: "No tienes permiso para responder a esta propuesta" });
        }

        // Construir mensaje MQTT según enunciado
        const mqttMessage = {
            auction_id: proposal.auction_id,
            proposal_id: proposal.id,
            url: proposal.property_url, // URL de la propuesta
            timestamp: new Date().toISOString(),
            quantity: proposal.quantity,
            group_id: myGroupId, // Nosotros respondemos
            operation: action // "acceptance" o "rejection"
        };

        // Enviar al Broker
        await axios.post(`${LISTENER_URL}/request`, {
            topic: process.env.MQTT_AUCTIONS_TOPIC || "properties/auctions",
            message: mqttMessage
        });

        // Actualizar estado localmente (El webhook también lo hará al recibir el rebote, pero esto da feedback inmediato)
        if (action === 'acceptance') {
            await proposal.update({ status: 'accepted' });
            await proposal.auction.update({ active: false }); // Cerrar subasta
        } else {
            await proposal.update({ status: 'rejected' });
        }

        res.json({ message: `Propuesta ${action} exitosamente` });

    } catch (error) {
        console.error("Error respondiendo propuesta:", error);
        res.status(500).json({ error: "Error interno" });
    }
  }
};

module.exports = proposalController;