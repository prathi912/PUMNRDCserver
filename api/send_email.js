const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const winston = require('winston');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Multer setup for file uploads
const upload = multer({
  dest: 'uploads/', // Temporary storage for uploaded files
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
});

// POST route for sending email with file upload
router.post('/', upload.single('idProof'), async (req, res) => {
  try {
    const { formData } = req.body;
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      association,
      equipment,
      selectedServices,
      additionalServices,
      bestTimeToContact,
      preferredMethodOfContact,
      additionalInformation,
    } = JSON.parse(formData); // Parse formData string to JSON

    // Nodemailer setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Prepare mail options
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: 'pranavrathi07@gmail.com', // Replace with recipient email
      subject: `New Contact Request from ${firstName} ${lastName}`,
      text: `
        Name: ${firstName} ${lastName}
        Email: ${email}
        Phone Number: ${phoneNumber}
        Association: ${association}
        Equipment: ${equipment}
        Selected Services: ${selectedServices?.join(', ') || 'None'}
        Additional Services: ${additionalServices?.join(', ') || 'None'}
        Best Time to Contact: ${bestTimeToContact || 'Not provided'}
        Preferred Method of Contact: ${preferredMethodOfContact || 'Not provided'}
        Additional Information: ${additionalInformation || 'None'}
      `,
      // Attach the uploaded file if it exists
      attachments: req.file
        ? [
            {
              filename: req.file.originalname,
              path: req.file.path,
            },
          ]
        : [],
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Delete the temporary uploaded file
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    // Log error and respond
    winston.error('Error sending email:', error);

    // Delete the temporary uploaded file if an error occurs
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ message: 'Failed to send email' });
  }
});

module.exports = router;
