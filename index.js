const express = require('express');
const cors = require('cors');
const sendEmailRoute = require('./send_email'); // Import the send email route

const app = express();

// CORS setup
const corsOptions = {
  origin: 'https://pumnrdc-next-pranavrathi07.vercel.app', // Allow only the frontend domain
  methods: 'GET,POST', // Allow only these methods
  allowedHeaders: 'Content-Type, Authorization', // Allow these headers
};
app.use(cors(corsOptions));

// Use the send email router
app.use('/api/send_email', sendEmailRoute);


// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
