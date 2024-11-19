// db.js
const fs = require('fs');
const path = require('path');

// Path to store payments data
const paymentsFilePath = path.join(__dirname, 'payments.json');

// In-memory storage for payments data
let paymentsData = {};

// Function to read payments data from a JSON file
const readPaymentData = () => {
  try {
    const data = fs.readFileSync(paymentsFilePath, 'utf-8');
    paymentsData = JSON.parse(data);
  } catch (error) {
    console.log('No previous payment data found, starting fresh.');
    paymentsData = {}; // Initialize empty object if the file doesn't exist
  }
};

// Function to write payment data to the JSON file
const savePaymentData = () => {
  fs.writeFileSync(paymentsFilePath, JSON.stringify(paymentsData, null, 2), 'utf-8');
};

// Initialize by reading existing payment data from file
readPaymentData();

module.exports = { paymentsData, savePaymentData };
