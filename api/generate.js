const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");
const admin = require("firebase-admin");
const fs = require("fs");

// Initialize Firebase Admin
const serviceAccountPath = '/etc/secrets/SECRET'; // Update the path if necessary
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Access environment variables
const EASEBUZZ_API_KEY = process.env.EASEBUZZ_API_KEY;
const EASEBUZZ_SALT_KEY = process.env.EASEBUZZ_SALT_KEY;
const EASEBUZZ_PAYMENT_LINK_API = "https://pay.easebuzz.in/payment/initiateLink";

// API endpoint to generate the payment link
router.post("/generate", async (req, res) => {
  const { uniqueKey } = req.body; // Assume uniqueKey is passed in the request body to identify the payment

  if (!uniqueKey) {
    return res.status(400).json({ error: "UniqueKey is required." });
  }

  try {
    // Fetch payment details from Firestore using uniqueKey
    const paymentDoc = await db.collection('payments').doc(uniqueKey).get();
    
    if (!paymentDoc.exists) {
      return res.status(404).json({ error: "Payment details not found." });
    }

    const paymentData = paymentDoc.data();

    // Prepare hash string using data from Firestore
    const txnId = paymentData.txnid;
    const amount = paymentData.amount;
    const productinfo = paymentData.productinfo || "Payment for PU Micro Nano R&D Services";
    const firstName = paymentData.firstName;
    const email = paymentData.email;
    const phone = paymentData.phone;

    // Generate the hash
    const hashString = `${EASEBUZZ_API_KEY}|${txnId}|${amount}|${productinfo}|${firstName}|${email}|||||||||||${EASEBUZZ_SALT_KEY}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    // Prepare the postData for Easebuzz API
    const postData = {
      key: EASEBUZZ_API_KEY,
      txnid: txnId,
      amount,
      productinfo,
      firstname: firstName,
      email,
      phone,
      surl: "https://micronanornd.paruluniversity.ac.in/payment/success", // Success URL
      furl: "https://micronanornd.paruluniversity.ac.in/payment/failure", // Failure URL
      hash,
    };

    // Make the API request to Easebuzz
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
