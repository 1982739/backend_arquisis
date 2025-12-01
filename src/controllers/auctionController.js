const { Auction, Proposal, propertie } = require('../models'); // <--- IMPORTANTE: Importar 'propertie'
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const LISTENER_URL = process.env.LISTENER_URL || 'http://listener:4000';

// Función auxiliar para actualizar el stock de una propiedad por URL
const updateStock = async (url, amount) => {
  try {
    // Buscamos la propiedad por URL
    const prop = await propertie.findOne({ where: { url: url } });
    
    if (prop) {
      // Si existe, actualizamos (increment maneja sumas y restas)
      await prop.increment('quantity', { by: amount });
      console.log(`🔄 Stock actualizado para ${url}: ${amount > 0 ? '+' : ''}${amount}`);
    } else {
      // Si no existe (es una propiedad nueva que ganamos), la creamos
      console.log(`✨ Creando propiedad nueva en inventario: ${url}`);
      await propertie.create({
        url: url,
        quantity: amount > 0 ? amount : 0,
        name: "Propiedad de Intercambio", // Datos placeholder
        price: 0,
        bedrooms: "0",
        m2: "0",
        location: "Desconocida"
      });
    }
  } catch (e) {
    console.error(`❌ Error actualizando stock para ${url}:`, e.message);
  }
};

const auctionController = {
  receiveWebhook: async (req, res) => {
    const data = req.body;
    console.log("📥 [API] Webhook recibido:", data.operation);

    try {
      if (data.operation === 'offer') {
        // ... (Tu código de offer igual que antes) ...
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
        // ... (Tu código de proposal igual que antes) ...
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
      // === NUEVO: Lógica para RF06 (Acceptance) ===
      else if (data.operation === 'acceptance') {
        console.log("🤝 Trato cerrado detectado. Calculando stocks...");
        
        // 1. Buscamos los datos en BD
        const auction = await Auction.findByPk(data.auction_id);
        const proposal = await Proposal.findByPk(data.proposal_id);

        if (auction && proposal) {
            // Limpieza del Group ID local
            let rawGroupId = process.env.GROUP_ID || "21";
            if (typeof rawGroupId === 'string') rawGroupId = rawGroupId.replace('group_', '');
            const myGroupId = parseInt(rawGroupId);

            // CASO A: NOSOTROS somos los dueños de la SUBASTA
            if (auction.group_id === myGroupId) {
                // Restamos lo que dimos (Auction)
                await updateStock(auction.property_url, -auction.quantity);
                // Sumamos lo que recibimos (Proposal)
                await updateStock(proposal.property_url, +proposal.quantity);
            }
            // CASO B: NOSOTROS somos los dueños de la PROPUESTA
            else if (proposal.group_id === myGroupId) {
                // Restamos lo que dimos (Proposal)
                await updateStock(proposal.property_url, -proposal.quantity);
                // Sumamos lo que recibimos (Auction)
                await updateStock(auction.property_url, +auction.quantity);
            }
            
            // Actualizamos estados para cerrar el ciclo
            await auction.update({ active: false });
            await proposal.update({ status: 'accepted' });
        }
      }
      // ============================================

      res.status(200).json({ message: "Datos procesados" });
    } catch (error) {
      console.error("❌ Error en webhook:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // ... (Tus funciones createAuction y getAllAuctions se mantienen igual) ...
  createAuction: async (req, res) => {
    // ... Tu código original ...
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