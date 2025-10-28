const { request: Request, propertie } = require("../models");
const { User } = require("../models");
async function getRequestByRequestId(request_id) {
  try {
    const request = await Request.findOne({
      where: { 'request_id': request_id }
    });

    if (!request) {
      return { error: "Request not found" };
    }
    return request.toJSON();
  } catch (err) {
    console.error(err);
    return { error: "Internal server error" };
  }
}

async function updateRequestStatus(request_id, status) {
  try {
    const [updated] = await Request.update(
      { status },
      { where: {'request_id': request_id } }
    );

    if (updated === 0) {
      return { error: "Request not found" };
    }

    const updatedRequest = await Request.findOne({ where: { request_id } });
    return updatedRequest.toJSON();
  } catch (err) {
    console.error("Error updating request:", err);
    return { error: "Internal server error" };
  }
}


async function chargeUserForRequest(user_id, amount) {
  if (typeof amount !== "number" || amount <= 0) {
    throw new Error("Invalid amount to charge");
  }

  // Buscar usuario
  const user = await User.findByPk(user_id);
  if (!user) {
    throw new Error("User not found");
  }

  // Verificar saldo
  if (user.wallet < amount) {
    throw new Error("Insufficient wallet balance");
  }

  // Actualizar saldo
  const newBalance = user.wallet - amount;
  await user.update({ wallet: newBalance });

  console.log(`User ${user.id} charged ${amount}. New balance: ${newBalance}`);
  return newBalance;
}

module.exports = {requestservices: {getRequestByRequestId, updateRequestStatus, chargeUserForRequest}};