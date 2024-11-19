const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const winston = require('winston');
const fs = require('fs');
const bodyParser = require('body-parser');

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

// Middleware to handle form data parsing
router.use(bodyParser.json());  // Parse JSON bodies
router.use(bodyParser.urlencoded({ extended: true }));  // Handle URL-encoded data

// POST route for sending email with file upload
router.post('/', upload.single('idProof'), async (req, res) => {
  try {
    // Check if formData exists and is provided
    if (!req.body.formData) {
      return res.status(400).json({ message: 'Form data is missing' });
    }

    // Parse JSON-formatted formData
    let parsedFormData;
    try {
      parsedFormData = JSON.parse(req.body.formData);  // Make sure to parse formData
    } catch (error) {
      return res.status(400).json({ message: 'Invalid form data format' });
    }

    // Extract values from parsed form data
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

    // Validate required fields
    if (!firstName || !email || !equipment) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    // File validation
    if (req.file && !['image/jpeg', 'image/png', 'application/pdf'].includes(req.file.mimetype)) {
      await fs.promises.unlink(req.file.path);  // Delete invalid file
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
      attachments: req.file ? [
        {
          filename: req.file.originalname,
          path: req.file.path,
        }
      ] : [],
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Clean up uploaded file if any
    if (req.file) {
      await fs.promises.unlink(req.file.path);
    }

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    logger.error('Error handling email request:', error);

    if (req.file) {
      await fs.promises.unlink(req.file.path).catch(err => {
        logger.error('Failed to delete uploaded file:', err);
      });
    }

    res.status(500).json({ message: 'Failed to send email' });
  }
});

module.exports = router;
