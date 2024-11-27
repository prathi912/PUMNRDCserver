const express = require('express');
const crypto = require('crypto');
const admin = require('firebase-admin');

const router = express.Router();

// Parse the service account JSON from environment variables
const serviceAccount = JSON.parse(process.env.SECRET);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

router.post('/generate', async (req, res) => {
  const { amount, email, phone } = req.body;

  if (!amount || !email || !phone) {
    return res.status(400).json({ error: 'Amount, email, and phone are required.' });
  }

  const uniqueKey = crypto.randomBytes(16).toString('hex');

  try {
    // Save payment details in Firestore
    await db.collection('payments').doc(uniqueKey).set({
      amount,
      email,
      phone,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create the payment URL (replace with the appropriate front-end URL for your app)
    const paymentUrl = `https://micronanornd.paruluniversity.ac.in/payment/${uniqueKey}`;

    // Respond with the generated link
    res.json({ link: paymentUrl });
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    res.status(500).json({ error: 'Failed to generate payment link.' });
  }
});

module.exports = router;
