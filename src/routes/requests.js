const express = require("express");
const router = express.Router();
const requestController = require("../controllers/requestController");


router.get("/requests", requestController.listRequests);
router.post("/properties/:id/request", requestController.createRequest);
router.post("/recive/request/:url", requestController.reciveRequest);

module.exports = router;
