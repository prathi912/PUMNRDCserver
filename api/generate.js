const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");

// Access environment variables
const EASEBUZZ_API_KEY = process.env.EASEBUZZ_API_KEY;
const EASEBUZZ_SALT_KEY = process.env.EASEBUZZ_SALT_KEY;
const EASEBUZZ_PAYMENT_LINK_API = "https://testpay.easebuzz.in/payment/initiateLink";

router.post("/generate", async (req, res) => {
  const { amount, email, phone, firstName } = req.body;

  if (!amount || !firstName || !email || !phone) {
    return res.status(400).json({ error: "Amount, email, first name, and phone are required." });
  }

  try {
    // Generate unique transaction ID
    const txnId = `TXN-${Date.now()}`;

    // Prepare the hash string
    const productinfo = "Payment for Micro Nano R&D Services";
    const hashString = `${EASEBUZZ_API_KEY}|${txnId}|${amount}|${productinfo}|${firstName}|${email}|||||||||||${EASEBUZZ_SALT_KEY}`;

    // Calculate the hash
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    // Prepare data for Easebuzz API
    const postData = {
      key: EASEBUZZ_API_KEY,
      txnid: txnId,
      amount,
      productinfo,
      firstname: firstName,
      email,
      phone,
      surl: "https://micronanornd.paruluniversity.ac.in/payment/success",
      furl: "https://micronanornd.paruluniversity.ac.in/payment/failure",
      hash,
    };

    // Make the API request
    const response = await axios.post(EASEBUZZ_PAYMENT_LINK_API, postData, {
      headers: { "Content-Type": "application/json" },
    });

    // Check if the response contains the payment link
    const { payment_link } = response.data;
    if (payment_link) {
      res.json({ txnId, paymentLink: payment_link });
    } else {
      res.status(500).json({ error: "Failed to generate payment link." });
    }
  } catch (error) {
    console.error("Error generating payment link:", error.message);
    res.status(500).json({ error: "Failed to generate payment link." });
  }
});

module.exports = router;
