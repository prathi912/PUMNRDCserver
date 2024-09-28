const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();  // Load environment variables

const app = express();
app.use(express.json());

// CORS configuration
app.use(cors({
  origin: '*',  // Allow requests from this origin
  methods: ['GET', 'POST'],                // Allow specific methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
  credentials: true  // Allow credentials if needed
}));

// POST route for sending email
app.post('/api/send-email', async (req, res) => {
  try {
    const { formData } = req.body;
    const { firstName, lastName, email, phoneNumber, Association, Equipment, bestTimeToContact, preferredMethodOfContact, additionalInformation } = formData;

    // Nodemailer setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,  // Your Gmail address from .env
        pass: process.env.GMAIL_PASS,    // Your Gmail app-specific password from .env
      },
    });

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
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error); // Log the error for debugging
    res.status(500).json({ message: 'Failed to send email', error: error.message }); // Return error message
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
