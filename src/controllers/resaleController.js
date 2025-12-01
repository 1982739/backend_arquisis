const { request: Request, Booking, propertie: Property } = require("../models");

const resaleController = {
  // GET /resale/available
  getAvailableResales: async (req, res) => {
    try {
      const myGroupId = process.env.GROUP_ID; // Tu grupo (ej: 17)

      // 1. Traer TODO lo que el grupo compró (Requests Aceptados = Stock)
      const myStock = await Request.findAll({
        where: { 
          group_id: myGroupId,
          status: 'ACCEPTED' 
        },
        include: [{ model: Property, as: 'propertie' }]
      });

      // 2. Traer TODO lo que ya se vendió (Bookings)
      // Asumimos que al vender, guardas el request_id en la tabla Booking
      const soldBookings = await Booking.findAll({
        attributes: ['request_id']
      });
      
      const soldRequestIds = soldBookings.map(b => b.request_id);

      // 3. FILTRAR: Lo que tengo MENOS lo que vendí
      const availableItems = myStock.filter(req => !soldRequestIds.includes(req.request_id));

      // 4. ARMAR RESPUESTA CON DESCUENTO (RF02)
      const data = availableItems.map(item => {
        const originalPrice = item.propertie ? item.propertie.price : 0;
        return {
            request_id: item.request_id, // ID para comprar
            property_name: item.propertie?.name || 'Sin nombre',
            location: item.propertie?.location || 'Sin ubicación',
            img: item.propertie?.img,
            original_price: originalPrice,
            // AQUÍ APLICAMOS EL 10% DE DESCUENTO
            final_price: Math.round(originalPrice * 0.9) 
        };
      });

      res.json(data);

    } catch (error) {
      console.error("Error en resale:", error);
      res.status(500).json({ error: "Error al obtener ofertas" });
    }
  },

  // POST /resale/buy (Para que el usuario compre la oferta)
  buyResale: async (req, res) => {
      try {
          const { request_id } = req.body;
          const userId = req.auth?.sub || "user_test"; // Auth0 ID

          // Verificar si sigue disponible
          const isSold = await Booking.findOne({ where: { request_id } });
          if (isSold) {
              return res.status(400).json({ error: "Esta oferta ya fue vendida." });
          }

          // Crear el Booking (Registrar la venta)
          const newBooking = await Booking.create({
              id: require('uuid').v4(),
              user_id: userId,
              request_id: request_id, // Vinculamos el cupo específico
              status: 'accepted',
              createdAt: new Date(),
              updatedAt: new Date()
          });

          res.status(201).json({ message: "¡Compra con descuento exitosa!", booking: newBooking });
      } catch (error) {
          console.error("Error comprando:", error);
          res.status(500).json({ error: "Error en la transacción" });
      }
  }
};

module.exports = resaleController;