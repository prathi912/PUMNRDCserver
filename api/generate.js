const express = require("express");
const router = express.Router();
const axios = require("axios");

// Replace with your Easebuzz credentials
const EASEBUZZ_API_KEY = process.env.EASEBUZZ_API_KEY; // Your Easebuzz API key
const EASEBUZZ_SALT_KEY = process.env.EASEBUZZ_SALT_KEY; // Your Easebuzz secret key
const EASEBUZZ_PAYMENT_LINK_API = "https://www.easebuzz.in/api/v1/transaction/generate-link"; // Easebuzz API endpoint

router.post("/generate", async (req, res) => {
  const { amount, email, phone } = req.body;

  // Validate the input
  if (!amount || !email || !phone) {
    return res.status(400).json({ error: "Amount, email, and phone are required." });
  }

  try {
    // Prepare the data to send to Easebuzz API
    const paymentData = {
      amount: amount,
      email: email,
      phone: phone,
      order_id: `ORD-${Date.now()}`, // Unique order ID (you can customize this)
      return_url: "https://yourdomain.com/payment-success", // Replace with your success URL
      cancel_url: "https://yourdomain.com/payment-failure", // Replace with your failure URL
    };

    // Make the request to Easebuzz API to generate the payment link
    const response = await axios.post(
      EASEBUZZ_PAYMENT_LINK_API,
      paymentData,
      {
        headers: {
          "Authorization": `Bearer ${EASEBUZZ_API_KEY}`,
          "Content-Type": "application/json",
        }
      }
    );

    // Check for response and return the payment link
    const paymentLink = response.data?.payment_link;

    if (!paymentLink) {
      throw new Error("Payment link generation failed.");
    }

    // Send the payment link back to the frontend
    res.json({ link: paymentLink });
  } catch (error) {
    console.error("Error generating payment link:", error.message);
    res.status(500).json({ error: "Failed to generate payment link." });
  }
});

module.exports = router;
