const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: 'https://pumnrdc.promate.tech', // Allow requests from this origin
  methods: ['GET', 'POST'],               // Allow specific methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
}));
app.use(express.json());

// Import the email route
const sendEmail = require('./api/send_email');
app.use('/api/send-email', sendEmail);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
