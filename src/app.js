const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const {Sequelize} = require("sequelize");
const orm = require("./models/index.js");
const propertyRoutes = require("./routes/properties.js");
const requestRoutes = require("./routes/requests.js");
const validationRoutes = require("./routes/validations.js");
dotenv.config();

const app = express();
app.use(cors());

app.locals.orm = orm;

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/', propertyRoutes);
app.use('/', requestRoutes);
app.use('/', validationRoutes);

//database connection
orm.sequelize.authenticate()
  .then(() => console.log('Database connected!'))
  .catch(err => console.error('Error connecting to database:', err));

app.get("/", (req, res) => {
  res.send("Servidor funcionando ");
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
