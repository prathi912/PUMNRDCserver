// index.js
const express = require('express');
const cors = require('cors');
const sendEmail = require('./api/send_email'); // Import your email route
require('dotenv').config(); // Load environment variables

const app = express();
app.use(express.json());

// CORS configuration
app.use(cors({
  origin: 'https://pumnrdc.promate.tech', // Allow your frontend
  methods: ['GET', 'POST'],               // Allow specific methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
  credentials: true  // Allow credentials if needed
}));

// Allow preflight requests
app.options('/api/send-email', cors());

// Use the email sending route
app.use('/api/send-email', sendEmail);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
