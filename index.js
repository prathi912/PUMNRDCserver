const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer');
const winston = require('winston');

const app = express();

// Middleware for parsing JSON request bodies
app.use(express.json());

// CORS setup
const corsOptions = {
  origin: 'https://pumnrdc-next-pranavrathi07.vercel.app', // Allow only this origin
  methods: 'GET,POST', // Allow only these methods
  allowedHeaders: 'Content-Type', // Allow these headers
};
app.use(cors(corsOptions));

// Multer setup for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
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

// POST route to send emails
app.post('/api/send_email', upload.single('idProof'), async (req, res) => {
  try {
    const { formData } = req.body;

    if (!formData) {
      return res.status(400).json({ message: 'Missing formData in request body' });
    }

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

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
