const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const winston = require('winston');

// Multer setup for handling file uploads
const upload = multer({
  dest: 'uploads/', // Temporary directory to store files
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and PDF files are allowed'));
    }
  },
});

// POST route for sending email
router.post('/', upload.single('idProof'), async (req, res) => {
  try {
    const { formData } = req.body;
    const parsedFormData = JSON.parse(formData); // Parse the JSON string into an object
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
    } = parsedFormData;

    let idProofPath = null;

    // Process the uploaded file if it exists
    if (req.file) {
      idProofPath = path.resolve(req.file.path); // Full path to the uploaded file
    }

    // Nodemailer setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Prepare the email content
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
        Selected Services: ${selectedServices.join(', ')}
        Additional Services: ${additionalServices.join(', ')}
        Best Time to Contact: ${bestTimeToContact}
        Preferred Method of Contact: ${preferredMethodOfContact}
        Additional Information: ${additionalInformation}
      `,
      attachments: idProofPath
        ? [
            {
              filename: req.file.originalname,
              path: idProofPath,
            },
          ]
        : [],
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Cleanup: Delete the uploaded file after sending email
    if (idProofPath) {
      fs.unlinkSync(idProofPath);
    }

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    // Log error and respond
    winston.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});

module.exports = router;
