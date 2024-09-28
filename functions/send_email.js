const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();  // Load the Gmail credentials from the .env file

const app = express();
app.use(express.json());
app.use(cors());

// POST route for sending email
app.post('/send-email', (req, res) => {
  const { formData } = req.body;
  const { firstName, lastName, email, phoneNumber, Association, Equipment, bestTimeToContact, preferredMethodOfContact, additionalInformation } = formData;

  // Nodemailer setup using Gmail credentials from the .env file
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,  // Your Gmail address from .env
      pass: process.env.GMAIL_PASS,  // Your Gmail app-specific password from .env
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: 'pranavrathi07@gmail.com', // Recipient email
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
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ message: 'Failed to send email' });
    }
    res.status(200).json({ message: 'Email sent successfully' });
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
