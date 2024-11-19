const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const winston = require('winston');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Multer setup for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// Logger setup
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log' }),
    new winston.transports.Console(),
  ],
});

// POST route for sending email with file upload
router.post('/', upload.single('idProof'), async (req, res) => {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      return res.status(500).json({ message: 'Email credentials are not configured' });
    }

    // Check if formData exists and is provided
    if (!req.body.formData) {
      return res.status(400).json({ message: 'Form data is missing' });
    }

    // Validate and parse formData
    let parsedFormData;
    try {
      parsedFormData = JSON.parse(req.body.formData);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid form data format' });
    }

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

    // Check for required fields
    if (!firstName || !email || !equipment) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    // File validation
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (req.file && !allowedMimeTypes.includes(req.file.mimetype)) {
      await fs.promises.unlink(req.file.path);
      return res.status(400).json({ message: 'Invalid file type. Only JPG, PNG, and PDF are allowed.' });
    }

    // Nodemailer setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Prepare email
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: 'pranavrathi07@gmail.com',
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
      attachments: req.file
        ? [
            {
              filename: req.file.originalname,
              path: path.join(__dirname, '..', req.file.path),
            },
          ]
        : [],
    };

    await transporter.sendMail(mailOptions);

    if (req.file) {
      await fs.promises.unlink(req.file.path);
    }

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    logger.error('Error handling email request:', error);

    if (req.file) {
      await fs.promises.unlink(req.file.path).catch((err) => {
        logger.error('Failed to delete uploaded file:', err);
      });
    }

    res.status(500).json({ message: 'Failed to send email' });
  }
});

module.exports = router;
