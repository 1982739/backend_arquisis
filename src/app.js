const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const orm = require("./models/index.js");
const propertyRoutes = require("./routes/properties.js");
const requestRoutes = require("./routes/requests.js");
const validationRoutes = require("./routes/validations.js");
const userRoutes = require("./routes/users.js");
const webpayRoutes = require("./routes/webpay.js");
const auctionRoutes = require("./routes/auctions.js");
const proposalRoutes = require("./routes/proposal.js");
dotenv.config();

const app = express();
app.use(cors());

app.locals.orm = orm;

// Middlewares
app.use(express.json());
app.use('/', propertyRoutes);
app.use('/', requestRoutes);
app.use('/', validationRoutes);
app.use('/', userRoutes);
app.use('/webpay', webpayRoutes);
app.use('/auctions', auctionRoutes);
app.use('/proposals', proposalRoutes);


// Ruta para pruebas
app.get("/", (req, res) => {
  res.status(200).json({ ok: true });
});

// Conexión a la base de datos
// Conexión a la base de datos SOLO si no estamos en tests
if (process.env.NODE_ENV !== "test") {
  orm.sequelize
    .authenticate()
    .then(() => console.log("Database connected!"))
    .catch((err) => console.error("Error connecting to database:", err));
}
// Exporta app SIN iniciar servidor
module.exports = app;
