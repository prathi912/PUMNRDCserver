// api/send-email.js
const nodemailer = require("nodemailer");

const allowedOrigins = [
  "https://micronanornd.paruluniversity.ac.in",
  "http://localhost:3000",
];

// CORS helper function
function setCorsHeaders(res, origin) {
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  setCorsHeaders(res, origin);

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Check CORS
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ message: "Not allowed by CORS" });
  }

  try {
    // Validate environment variables
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.error("Missing email configuration");
      return res.status(500).json({
        message: "Server configuration error: Email credentials not found",
      });
    }

    console.log("Request body:", req.body);
    console.log("Content-Type:", req.headers["content-type"]);

    // Handle FormData (multipart) vs JSON
    let parsedFormData;
    let fileData = null;

    // Check if this is FormData (multipart/form-data)
    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      // For FormData, data comes in req.body directly
      if (req.body.formData) {
        try {
          parsedFormData =
            typeof req.body.formData === "string"
              ? JSON.parse(req.body.formData)
              : req.body.formData;
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          return res.status(400).json({ message: "Invalid JSON in formData" });
        }
      } else {
        return res
          .status(400)
          .json({ message: "Missing formData in multipart request" });
      }

      // Handle file from multipart
      fileData = req.body.idProof; // This should match your form field name
    } else {
      // Handle JSON request
      if (req.body.formData) {
        try {
          parsedFormData =
            typeof req.body.formData === "string"
              ? JSON.parse(req.body.formData)
              : req.body.formData;
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          return res.status(400).json({ message: "Invalid JSON in formData" });
        }
        fileData = req.body.file;
      } else {
        // Direct JSON object
        parsedFormData = req.body;
        fileData = req.body.file;
      }
    }

    if (!parsedFormData) {
      console.error("No form data found");
      return res.status(400).json({ message: "No form data provided" });
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
      selectedServices = [],
      additionalServices = [],
      numberOfSamples,
      bestTimeToContact,
      preferredMethodOfContact,
      additionalInformation,
    } = parsedFormData;

    // Create transporter optimized for serverless
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
      pool: false, // Important for serverless
      maxConnections: 1,
      maxMessages: 1,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      debug: false,
      logger: false,
    });

    // Prepare attachments
    const attachments = [];
    if (fileData && fileData.content && fileData.name) {
      attachments.push({
        filename: fileData.name,
        content: Buffer.from(fileData.content, "base64"),
      });
    }

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: "micronanornd@paruluniversity.ac.in",
      subject: `New Contact Request from ${firstName} ${lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            New Contact Request
          </h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #007bff; margin-top: 0;">Contact Information</h3>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Phone:</strong> ${phoneNumber}</p>
            <p><strong>Association:</strong> ${association}</p>
          </div>
          
          <div style="background: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #007bff; margin-top: 0;">Service Details</h3>
            <p><strong>Equipment:</strong> ${equipment}</p>
            <p><strong>Selected Services:</strong> ${
              Array.isArray(selectedServices)
                ? selectedServices.join(", ")
                : "None"
            }</p>
            <p><strong>Additional Services:</strong> ${
              Array.isArray(additionalServices)
                ? additionalServices.join(", ")
                : "None"
            }</p>
            <p><strong>Number of Samples:</strong> ${numberOfSamples}</p>
          </div>
          
          <div style="background: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #007bff; margin-top: 0;">Sample Information</h3>
            <p><strong>Material Conductivity:</strong> ${
              materialConductivity || "Not Specified"
            }</p>
            <p><strong>Biological Nature:</strong> ${
              biologicalnature || "Not Specified"
            }</p>
            <p><strong>Type of Sample:</strong> ${
              TypeOfSample || "Not Specified"
            }</p>
          </div>
          
          <div style="background: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #007bff; margin-top: 0;">Contact Preferences</h3>
            <p><strong>Best Time to Contact:</strong> ${bestTimeToContact}</p>
            <p><strong>Preferred Method:</strong> ${preferredMethodOfContact}</p>
            ${
              additionalInformation
                ? `<p><strong>Additional Information:</strong> ${additionalInformation}</p>`
                : ""
            }
          </div>
          
          <div style="margin-top: 30px; padding: 15px; background: #e9ecef; border-radius: 5px; font-size: 12px; color: #6c757d;">
            <p>This email was sent from the contact form on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
      attachments: attachments,
    };

    // Send email with proper cleanup
    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        transporter.close(); // Always close connection

        if (error) {
          reject(error);
        } else {
          resolve(info);
        }
      });
    });

    console.log("Email sent successfully");
    return res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    let errorMessage = "Failed to send email";
    let statusCode = 500;

    if (error.code === "ETIMEDOUT") {
      errorMessage = "Email service timeout. Please try again later.";
      statusCode = 504;
    } else if (error.code === "EAUTH") {
      errorMessage = "Email authentication failed";
      statusCode = 500;
    } else if (error.code === "ECONNREFUSED") {
      errorMessage = "Email service unavailable";
      statusCode = 503;
    }

    return res.status(statusCode).json({
      message: errorMessage,
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
}
