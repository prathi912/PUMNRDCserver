const express = require('express');
const sendEmailRoute = require('./api/send_email');
const paymentRoute = require('./api/payment');
const generateRoute = require('./api/generate');

const app = express();

// Middleware for CORS (allowing all origins for now, adjust in production)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow all origins (use a specific origin in production)
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
app.use("/api/payment", paymentRoute); // Ensure payment route is set correctly
app.use('/api/send_email', sendEmailRoute); // Send email route
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
