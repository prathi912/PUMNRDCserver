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
    const { subject, email, html } = req.body; // Destructure request body

    const mailOptions = {
        from: process.env.GMAIL_USER, // Use the same email as above
        to: email,
        subject: subject,
        html: html,
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

// Function to send a test email
const sendTestEmail = async () => {
    const testEmailOptions = {
        subject: 'Test Email',
        html: '<html><p>This is a test email sent from the Node.js server.</p><p>This is another test.</p></html>',
        email: 'jeetvani171@gmail.com', // Replace with the test recipient email
    };

    try {
        let response = await fetch(`http://localhost:${port}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testEmailOptions),
        });

        if (response.ok) {
            console.log('Test email sent successfully');
        } else {
            console.log('Failed to send test email');
        }
    } catch (error) {
        console.error('Error in sending test email: ', error);
    }
};

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    // Call the test function to send the email
    sendTestEmail();
});
