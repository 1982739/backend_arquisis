const { User } = require("../models");
const axios = require("axios");
// Obtener el wallet del usuario actual
exports.getWallet = async (req, res) => {
  try {
    const auth0_id = req.auth.sub; // viene del token JWT (ej: "auth0|abc123")
    const user = await User.findOne({ where: { auth0_id } });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ wallet: user.wallet });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};


  
// Recargar el wallet
exports.rechargeWallet = async (req, res) => {
  try {
    const auth0_id = req.auth.sub;
    let { amount } = req.body;

    // Convertir a número explícitamente
    amount = Number(amount);

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid recharge amount" });
    }

    const user = await User.findOne({ where: { auth0_id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 👇 El campo correcto según tu modelo es probablemente 'wallet'
    const newBalance = user.wallet + amount;

    await User.update({ wallet: newBalance }, { where: { auth0_id } });

    res.json({ message: "Wallet recharged successfully", newBalance });
  } catch (error) {
    console.error("Error in rechargeWallet:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.createUserIfNotExists = async (req, res) => {
  try {
    const { sub } = req.auth;

    // 🔹 Obtener más info del usuario desde Auth0
    const userInfoResponse = await axios.get(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
      headers: {
        Authorization: req.headers.authorization, // el mismo token Bearer
      },
    });

    const { email, name } = userInfoResponse.data;

    console.log("Creating user if not exists:", sub, email);

    const [user] = await User.findOrCreate({
      where: { auth0_id: sub },
      defaults: { email, name, wallet: 0 },
    });

    res.status(200).json(user);
  } catch (err) {
    console.error("Error in createUserIfNotExists:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (err) {
    console.error("Error in listUsers:", err);
    res.status(500).json({ error: err.message });
  }
};
