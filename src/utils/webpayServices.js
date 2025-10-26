const { WebpayPlus } = require("transbank-sdk");
require("dotenv").config();

const tx = new WebpayPlus.Transaction(
  new WebpayPlus.Options(
    process.env.WEBPAY_COMMERCE_CODE,
    process.env.WEBPAY_API_KEY,
    WebpayPlus.Environment.Integration
  )
);

module.exports = { tx };
