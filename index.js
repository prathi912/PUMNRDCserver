const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port

// Middleware
app.use(express.json());
app.use(cors({
    origin: "*", // Allow all origins (for production, specify allowed origins)
}));

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use Gmail as the email service
    auth: {
        user: process.env.GMAIL_USER, // Load from environment variable
        pass: process.env.GMAIL_PASS, // Load from environment variable (app password)
    },
});

// POST endpoint to send email
app.post('/send-email', async (req, res) => {
    const { formData } = req.body; // Expecting formData in the request body
    const { firstName, lastName, email, phoneNumber, association, equipment, bestTimeToContact, preferredMethodOfContact, additionalInformation } = formData;

    const mailOptions = {
        from: process.env.GMAIL_USER, // Use the same email as above
        to: 'rathipranav07@gmail.com', // Replace with recipient email
        subject: `New Contact Request from ${firstName} ${lastName}`,
        text: `
            Name: ${firstName} ${lastName}
            Email: ${email}
            Phone Number: ${phoneNumber}
            association: ${association}
            equipment: ${equipment}
            Best Time to Contact: ${bestTimeToContact}
            Preferred Method of Contact: ${preferredMethodOfContact}
            Additional Information: ${additionalInformation}
        `,
    };

    try {
        let info = await transporter.sendMail(mailOptions); // Send the email
        console.log('Email sent: ' + info.response);
        res.status(200).send('Email sent successfully');
    } catch (error) {
        console.error('Error sending email: ', error); // Log the error
        res.status(500).send('Failed to send email');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
