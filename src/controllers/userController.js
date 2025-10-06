const { User } = require("../models");

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
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid recharge amount" });
    }

    const user = await User.findOne({ where: { auth0_id } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const newBalance = user.wallet_balance + amount;
    await User.update({ wallet: newBalance }, { where: { auth0_id } });

    res.json({ message: "Wallet recharged successfully", newBalance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Crear usuario (se llama cuando un usuario se registra por primera vez)...
exports.createUserIfNotExists = async (req, res) => {
  try {
    const { sub, email } = req.auth;

    const [user, created] = await User.findOrCreate({
      where: { auth0_id: sub },
      defaults: { email },
    });

    res.json({
      message: created ? "User created" : "User already exists",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
