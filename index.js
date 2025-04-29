const express = require('express');
const cors = require('cors');
const sendEmailRoute = require('./api/send_email');

const app = express();

const allowedOrigins = [
  'https://micronanornd.paruluniversity.ac.in/', // e.g., Vercel domain
  'http://localhost:3000' // for local testing
];

app.use(cors({
  origin: 'https://micronanornd.paruluniversity.ac.in', // Only allow this domain
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
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
