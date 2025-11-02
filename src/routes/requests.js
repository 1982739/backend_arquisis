const express = require("express");
const router = express.Router();
const requestController = require("../controllers/requestController");
const { checkJwt } = require("../middleware/auth");

router.get("/requests", checkJwt, requestController.listRequests);
router.post("/properties/:id/request", requestController.createRequest);
router.post("/recive/request", requestController.reciveRequest);
router.get("/requests/:request_id", requestController.getRequestInfoById);

module.exports = router;
