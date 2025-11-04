const express = require("express");
const axios = require("axios");
const router = express.Router();

const JOB_URL = "http://18.219.219.11:3001/job/rec-8-1762228507377";

router.get("/heartbeat", async (_req, res) => {
    try {
        const response = await axios.get(JOB_URL);
        const { status } = response.data;

        if (status === "completed") {
            return res.status(200).send("❤️");
        }

        return res.status(200).send("💀");

    } catch (error) {
        console.error("❌ heartbeat error:", error.message);
        return res.status(500).send("💀");
    }
});

module.exports = router;
