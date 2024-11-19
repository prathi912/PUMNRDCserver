const express = require("express");
const router = express.Router();
const axios = require("axios");

// Access environment variables
const EASEBUZZ_API_KEY = process.env.EASEBUZZ_API_KEY;
const EASEBUZZ_SALT_KEY = process.env.EASEBUZZ_SALT_KEY;
const EASEBUZZ_PAYMENT_LINK_API = "https://www.easebuzz.in/api/v1/transaction/initiate";

router.post("/generate", async (req, res) => {
  const { amount, email, phone } = req.body;

  if (!amount || !email || !phone) {
    return res.status(400).json({ error: "Amount, email, and phone are required." });
  }

  try {
    // Prepare data for Easebuzz API
    const txnId = `TXN-${Date.now()}`;
    const postData = {
      key: EASEBUZZ_API_KEY,
      txnid: txnId,
      amount,
      firstname: "User", // Replace with the customer's name if available
      email,
      phone,
      productinfo: "Payment for R&D Services",
      surl: "https://yourdomain.com/payment-success", // Success URL
      furl: "https://yourdomain.com/payment-failure", // Failure URL
      salt: EASEBUZZ_SALT_KEY, // This is needed to calculate the hash
    };

    // Calculate the hash for request
    const hashString = `${EASEBUZZ_API_KEY}|${txnId}|${amount}|Payment for Micro Nano R&D Services|User|${email}|||||||||||${EASEBUZZ_SALT_KEY}`;
    const crypto = require("crypto");
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    postData.hash = hash;

    // Send API request to Easebuzz
    const response = await axios.post(EASEBUZZ_PAYMENT_LINK_API, postData, {
      headers: { "Content-Type": "application/json" },
    });

    // Return the transaction ID and payment link
    const { payment_link } = response.data;
    if (payment_link) {
      res.json({ txnId, easebuzzAccessKey: EASEBUZZ_API_KEY, paymentLink: payment_link });
    } else {
      res.status(500).json({ error: "Failed to generate payment link." });
    }
  } catch (error) {
    console.error("Error generating payment link:", error.message);
    res.status(500).json({ error: "Failed to generate payment link." });
  }
});

module.exports = router;
