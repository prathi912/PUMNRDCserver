const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const bodyParser = require('body-parser');
const winston = require('winston');
const router = express.Router();
const app = express(); // Make sure to declare 'app'

// Body parser middleware for parsing JSON and URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Multer setup for memory storage
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory as Buffers
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
    if (!req.body.formData) {
      return res.status(400).json({ message: 'Missing formData in request body' });
    }

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

    let fileBuffer = null;
    let fileName = null;

    // Process the uploaded file if it exists
    if (req.file) {
      fileBuffer = req.file.buffer; // File content as Buffer
      fileName = req.file.originalname; // Original file name
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
      attachments: fileBuffer
        ? [
            {
              filename: fileName,
              content: fileBuffer, // Attach the file from memory buffer
            },
          ]
        : [],
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    // Log error and respond
    winston.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
});

// Export the router
module.exports = router;

// Ensure to use the router in your main application file
app.use('/send-email', router);

// Start the server (ensure the PORT is defined in your environment variables or set a default value)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
