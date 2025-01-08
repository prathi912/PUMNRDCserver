const express = require('express');
const sendEmailRoute = require('./api/send_email');

const app = express();

// List of whitelisted domains
const allowedOrigins = [
  '*'
  // Add the specific origins you want to allow
];
// Middleware for CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Allow specific origins
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*'); // Allow all for testing
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Include OPTIONS
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(204).end(); // Respond with no content
  }

  next();
});

// Middleware to parse incoming requests with JSON payloads
app.use(express.json());

// Routes for payment and email functionality
app.use('/api/send_email', sendEmailRoute);


const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});
