// api/send-email.js (Vercel API route with Nodemailer fix)
const nodemailer = require("nodemailer");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Validate environment variables
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error("Missing email configuration");
      return res.status(500).json({
        message: "Server configuration error: Email credentials not found",
      });
    }

    const { formData, file } = req.body;

    let parsedFormData;
    try {
      parsedFormData =
        typeof formData === "string" ? JSON.parse(formData) : formData;
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
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
      selectedServices = [],
      additionalServices = [],
      numberOfSamples,
      bestTimeToContact,
      preferredMethodOfContact,
      additionalInformation,
    } = parsedFormData;

    // Create transporter with optimized settings for serverless
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS, // Use App Password, not regular password
      },
      // Optimized for serverless
      pool: false, // Disable connection pooling
      maxConnections: 1,
      maxMessages: 1,
      rateDelta: 1000,
      rateLimit: 1,
      // Reduced timeouts for serverless
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 5000, // 5 seconds
      socketTimeout: 10000, // 10 seconds
      debug: false,
      logger: false,
    });

    // Prepare attachments
    const attachments = file
      ? [
          {
            filename: file.name,
            content: Buffer.from(file.content, "base64"),
          },
        ]
      : [];

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

    // Send email with proper error handling for serverless
    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        // Always close the transporter
        transporter.close();

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
