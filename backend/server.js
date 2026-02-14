// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - MUST BE BEFORE ROUTES
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
console.log('Auth routes loaded:', authRoutes); // ADD THIS LINE

// Use routes
app.use('/api/auth', authRoutes);

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});