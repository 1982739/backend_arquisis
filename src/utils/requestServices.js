const { request: Request, propertie } = require("../models");
async function getRequestByRequestId(request_id) {
  try {
    const request = await Request.findOne({
      where: { request_id }
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
      { where: { request_id } }
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


module.exports = {getRequestByRequestId, updateRequestStatus};