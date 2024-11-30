const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");
const admin = require("firebase-admin");
const fs = require("fs");

// Initialize Firebase Admin only if not initialized already
if (!admin.apps.length) {
  try {
    const serviceAccountPath = "/etc/secrets/SECRET"; // Adjust the path if necessary
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Error initializing Firebase:", error.message);
  }
} else {
  console.log("Firebase app already initialized.");
}

const db = admin.firestore();

// Environment variables
const EASEBUZZ_API_KEY = process.env.EASEBUZZ_API_KEY || "";
const EASEBUZZ_SALT_KEY = process.env.EASEBUZZ_SALT_KEY || "";
const EASEBUZZ_PAYMENT_LINK_API = "https://pay.easebuzz.in/payment/initiateLink";

// Ensure required environment variables are set
if (!EASEBUZZ_API_KEY || !EASEBUZZ_SALT_KEY) {
  console.error("Missing required environment variables: EASEBUZZ_API_KEY or EASEBUZZ_SALT_KEY");
}

// Generate Payment Link API
router.post("/generate", async (req, res) => {
  const { uniqueKey } = req.body;

  if (!uniqueKey) {
    return res.status(400).json({ error: "UniqueKey is required." });
  }

  try {
    // Fetch payment details from Firestore
    const paymentDoc = await db.collection("payments").doc(uniqueKey).get();
    if (!paymentDoc.exists) {
      return res.status(404).json({ error: "Payment details not found for the provided uniqueKey." });
    }

    const paymentData = paymentDoc.data();
    const txnId = paymentData.txnid;
    const amount = paymentData.amount;
    const productinfo = paymentData.productinfo || "Payment for Micro Nano R&D Services";
    const firstName = paymentData.firstName;
    const email = paymentData.email;
    const phone = paymentData.phone;

    // Generate hash
    const hashString = `${EASEBUZZ_API_KEY}|${txnId}|${amount}|${productinfo}|${firstName}|${email}|||||||||||${EASEBUZZ_SALT_KEY}`;
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
      surl: "https://micronanornd.paruluniversity.ac.in/payment/success", // Success URL
      furl: "https://micronanornd.paruluniversity.ac.in/payment/failure", // Failure URL
      hash,
      udf1: paymentData.udf1 || "",
      udf2: paymentData.udf2 || "",
      udf3: paymentData.udf3 || "",
      address1: paymentData.address1 || "Parul University",
      city: paymentData.city || "Vadodara",
      state: paymentData.state || "Gujarat",
      country: paymentData.country || "India",
      zipcode: paymentData.zipcode || "391760",
    };

    // Send request to Easebuzz
    const response = await axios.post(
      EASEBUZZ_PAYMENT_LINK_API,
      new URLSearchParams(postData).toString(),
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Process Easebuzz API response
    if (response.data.status === 1 && response.data.data) {
      return res.json({ txnId, paymentLink: response.data.data });
    } else {
      console.error("Easebuzz API error:", response.data);
      return res.status(500).json({
        error: "Failed to generate payment link.",
        details: response.data.message || "Unknown error from Easebuzz API",
      });
    }
  } catch (error) {
    console.error("Error generating payment link:", error.message);
    res.status(500).json({
      error: "An unexpected error occurred while generating the payment link.",
      details: error.message,
    });
  }
});

module.exports = router;
