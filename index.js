const express = require('express');
const sendEmailRoute = require('./api/send_email');
const paymentRoute = require('./api/payment');
const generateRoute = require('./api/generate');

const app = express();

// List of whitelisted domains
const allowedOrigins = [
  'https://micronanornd.paruluniversity.ac.in', // Add the specific origins you want to allow
];

// Middleware for CORS (only allowing whitelisted origins)
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Check if the request's origin is in the whitelist
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin); // Allow the origin
  } else {
    res.header('Access-Control-Allow-Origin', ''); // Reject if origin is not in the whitelist
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST'); // Allow only GET and POST methods
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Allow these headers

  // Allow preflight requests (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// Middleware to parse incoming requests with JSON payloads
app.use(express.json());

// Routes for payment and email functionality
app.use('/api/payment', paymentRoute);
app.use('/api/send_email', sendEmailRoute);
app.use('/api/generate', generateRoute);

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
