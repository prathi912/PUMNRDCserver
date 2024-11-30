const express = require('express');
const crypto = require('crypto');
const admin = require('firebase-admin');
const fs = require('fs');

const router = express.Router();

// Read and parse the secret file from Render's mounted secrets directory
const serviceAccountPath = '/etc/secrets/SECRET'; // Update the file name if necessary
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

console.log('Firestore Project ID:', serviceAccount.project_id);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// API Endpoint to generate a payment link
router.post('./api/generate', async (req, res) => {
  const { amount, firstName, email, phone } = req.body;

  // Validate input
  if (!amount || !firstName || !email || !phone) {
    return res.status(400).json({ error: 'Amount, firstName, email, and phone are required.' });
  }

  // Generate a unique key for the payment
  const uniqueKey = crypto.randomBytes(16).toString('hex');

  try {
    console.log('Saving payment data to Firestore:', { uniqueKey, firstName, amount, email, phone });

    // Save payment details in Firestore
    await db.collection('payments').doc(uniqueKey).set({
      txnid: uniqueKey,
      amount,
      firstName,
      email,
      phone,
      productinfo: "PU MICRO-NANO R&D RESEARCH CENTRE SERVICE",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Generate Easebuzz payload
    const easebuzzPayload = {
      key: process.env.EASEBUZZ_KEY,
      txnid: uniqueKey,
      amount,
      firstname: firstName,
      email,
      phone,
      productinfo: "PU Micro-Nano Research & Development Centre Service",
      surl: "https://micronanornd.paruluniversity.ac.in/payment/success",
      furl: "https://micronanornd.paruluniversity.ac.in/payment/failure",
    };

    // Generate hash
    const hashString = `${easebuzzPayload.key}|${easebuzzPayload.txnid}|${easebuzzPayload.amount}|${easebuzzPayload.productinfo}|${easebuzzPayload.firstname}|${easebuzzPayload.email}|||||||||||${process.env.EASEBUZZ_SALT}`;
    easebuzzPayload.hash = crypto.createHash('sha512').update(hashString).digest('hex');

    // Respond with the payload and link
    res.json({
      success: true,
      paymentData: easebuzzPayload,
      link: `https://micronanornd.paruluniversity.ac.in/payment/${uniqueKey}`,
    });
  } catch (error) {
    console.error('Error generating payment link:', error.message);
    res.status(500).json({ error: 'Failed to generate payment link.' });
  }
});

module.exports = router;
