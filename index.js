const express = require('express');
const cors = require('cors');
const sendEmailRoute = require('./api/send_email');

const app = express();

const allowedOrigins = [
<<<<<<< HEAD
  'https://micronanornd.paruluniversity.ac.in/', // e.g., Vercel domain
=======
  'https://micronanornd.paruluniversity.ac.in', // e.g., Vercel domain
>>>>>>> 66f6e2f478fdea17135c290c7f2543e2c8fb53a9
  'http://localhost:3000' // for local testing
];

app.use(cors({
  origin: function (origin, callback) {
<<<<<<< HEAD
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
=======
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
>>>>>>> 66f6e2f478fdea17135c290c7f2543e2c8fb53a9
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
