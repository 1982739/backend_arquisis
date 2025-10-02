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

module.exports = {getRequestByRequestId};