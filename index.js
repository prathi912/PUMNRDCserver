const express = require('express');
const cors = require('cors');
const sendEmailRoute = require('./api/send_email');

const app = express();

const corsOptions = {
  origin: '*',  // Allow any origin
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type, Authorization',
  preflightContinue: false,
  optionsSuccessStatus: 200,
};


app.use(cors(corsOptions));

app.use('/api/send_email', sendEmailRoute);

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});