const express = require('express');
const crypto = require('crypto');
const admin = require('firebase-admin');
const fs = require('fs');

const router = express.Router();

// Read and parse the secret file from Render's mounted secrets directory
const serviceAccountPath = '/etc/secrets/SECRET'; // Update the file name if necessary
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// API Endpoint to generate a payment link
router.post('/generate', async (req, res) => {
  const { amount, email, phone } = req.body;

  // Validate input
  if (!amount || !email || !phone) {
    return res.status(400).json({ error: 'Amount, email, and phone are required.' });
  }

  // Generate a unique key for the payment
  const uniqueKey = crypto.randomBytes(16).toString('hex');

  try {
    console.log('Saving payment data to Firestore:', { uniqueKey, amount, email, phone });

    // Save payment details in Firestore with retry logic
    await db.collection('payments').doc(uniqueKey).set({
      amount,
      email,
      phone,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create the payment URL (replace with your front-end URL)
    const paymentUrl = `https://micronanornd.paruluniversity.ac.in/payment/${uniqueKey}`;

    // Respond with the generated link
    res.json({ link: paymentUrl });
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    res.status(500).json({ error: 'Failed to generate payment link.' });
  }
});

module.exports = router;
