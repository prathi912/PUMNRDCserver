const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// Dummy in-memory data store (can be replaced with a database)
let paymentDataStore = {};

// Generate a unique payment link
router.post('/generate', (req, res) => {
  const { amount, email, phone } = req.body;

  // Validate the input
  if (!amount || !email || !phone) {
    return res.status(400).json({ error: 'Amount, email, and phone are required.' });
  }

  // Generate a unique key using crypto
  const uniqueKey = crypto.randomBytes(16).toString('hex');

  // Save payment details in the store (this would be a DB in a real app)
  paymentDataStore[uniqueKey] = { amount, email, phone };

  // Create the payment URL (replace with the appropriate front-end URL for your app)
  const paymentUrl = `https://pumnrdc-next-pranavrathi07.vercel.app/payment/${uniqueKey}`;

  // Respond with the generated link
  res.json({ link: paymentUrl });
});

module.exports = router;
