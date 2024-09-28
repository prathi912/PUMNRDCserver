const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();  // Load environment variables

const app = express();
app.use(express.json());

// CORS configuration
app.use(cors({
  origin: 'https://pumnrdc.promate.tech',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true  // Allow credentials if needed
}));

// POST route for sending email
app.post('./send_email.js', (req, res) => {
  const { formData } = req.body;
  const { firstName, lastName, email, phoneNumber, Association, Equipment, bestTimeToContact, preferredMethodOfContact, additionalInformation } = formData;

  // Nodemailer setup
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  app.options('/api/send-email', cors());
  
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: 'pranavrathi07@gmail.com',  // Replace with recipient email
    subject: `New Contact Request from ${firstName} ${lastName}`,
    text: `
      Name: ${firstName} ${lastName}
      Email: ${email}
      Phone Number: ${phoneNumber}
      Association: ${Association}
      Equipment: ${Equipment}
      Best Time to Contact: ${bestTimeToContact}
      Preferred Method of Contact: ${preferredMethodOfContact}
      Additional Information: ${additionalInformation}
    `
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ message: 'Failed to send email' });
    }
    res.status(200).json({ message: 'Email sent successfully' });
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
