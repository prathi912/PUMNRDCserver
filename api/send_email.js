const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const bodyParser = require("body-parser");
const winston = require("winston");

// Configure Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
});

const router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and PDF files are allowed"));
    }
  },
});

// Create transporter outside the route for better performance
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: "gmail", // Use service instead of manual config
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS, // Make sure this is an App Password
    },
    // Remove problematic TLS settings
    // tls: {
    //   ciphers: 'SSLv3' // This is outdated and insecure
    // },

    // Add timeout configurations
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 60000, // 60 seconds

    debug: process.env.NODE_ENV === "development", // Only debug in development
  });
};

// Test transporter connection on startup
const testConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    logger.info("SMTP connection verified successfully");
  } catch (error) {
    logger.error("SMTP connection failed:", error);
  }
};

// Call test connection when module loads
testConnection();

router.post("/", upload.single("idProof"), async (req, res) => {
  try {
    // Validate environment variables
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      logger.error("Missing email configuration");
      return res.status(500).json({
        message: "Server configuration error: Email credentials not found",
      });
    }

    if (!req.body.formData) {
      return res
        .status(400)
        .json({ message: "Missing formData in request body" });
    }

    const { formData } = req.body;
    let parsedFormData;

    try {
      parsedFormData = JSON.parse(formData);
    } catch (parseError) {
      logger.error("JSON parse error:", parseError);
      return res.status(400).json({ message: "Invalid JSON in formData" });
    }

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      association,
      equipment,
      materialConductivity,
      biologicalnature,
      TypeOfSample,
      selectedServices = [], // Default to empty array
      additionalServices = [], // Default to empty array
      numberOfSamples,
      bestTimeToContact,
      preferredMethodOfContact,
      additionalInformation,
    } = parsedFormData;

    let fileBuffer = null;
    let fileName = null;

    // Process the uploaded file if it exists
    if (req.file) {
      fileBuffer = req.file.buffer;
      fileName = req.file.originalname;
      logger.info(`File uploaded: ${fileName}, Size: ${req.file.size} bytes`);
    }

    // Create transporter
    const transporter = createTransporter();

    // Test connection before sending
    try {
      await transporter.verify();
      logger.info("Transporter verified before sending email");
    } catch (verifyError) {
      logger.error("Transporter verification failed:", verifyError);
      return res.status(500).json({
        message: "Email service unavailable. Please try again later.",
      });
    }

    // Prepare the email content
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: "micronanornd@paruluniversity.ac.in",
      subject: `New Contact Request from ${firstName} ${lastName}`,
      html: `
        <h3>New Contact Request</h3>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone Number:</strong> ${phoneNumber}</p>
        <p><strong>Association:</strong> ${association}</p>
        <p><strong>Equipment:</strong> ${equipment}</p>
        <p><strong>Selected Services:</strong> ${
          Array.isArray(selectedServices) ? selectedServices.join(", ") : "None"
        }</p>
        <p><strong>Additional Services:</strong> ${
          Array.isArray(additionalServices)
            ? additionalServices.join(", ")
            : "None"
        }</p>
        <p><strong>Number of Samples:</strong> ${numberOfSamples}</p>
        <p><strong>Best Time to Contact:</strong> ${bestTimeToContact}</p>
        <p><strong>Preferred Method of Contact:</strong> ${preferredMethodOfContact}</p>
        <p><strong>Material Conductivity:</strong> ${
          materialConductivity || "Not Specified"
        }</p>
        <p><strong>Biological Nature:</strong> ${
          biologicalnature || "Not Specified"
        }</p>
        <p><strong>Type of Sample:</strong> ${
          TypeOfSample || "Not Specified"
        }</p>
        ${
          additionalInformation
            ? `<p><strong>Additional Information:</strong> ${additionalInformation}</p>`
            : ""
        }
      `,
      attachments: fileBuffer
        ? [
            {
              filename: fileName,
              content: fileBuffer,
            },
          ]
        : [],
    };

    // Send email with timeout handling
    logger.info("Attempting to send email...");

    const emailPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Email send timeout")), 30000); // 30 second timeout
    });

    await Promise.race([emailPromise, timeoutPromise]);

    logger.info("Email sent successfully");
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    // Enhanced error logging
    logger.error("Error sending email:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // Send appropriate error response
    let errorMessage = "Failed to send email";
    let statusCode = 500;

    if (error.code === "ETIMEDOUT" || error.message === "Email send timeout") {
      errorMessage = "Email service timeout. Please try again later.";
      statusCode = 504;
    } else if (error.code === "EAUTH") {
      errorMessage = "Email authentication failed";
      statusCode = 500;
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = "Email service unavailable";
      statusCode = 503;
    }

    res.status(statusCode).json({
      message: errorMessage,
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

module.exports = router;
