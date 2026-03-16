const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/classes',     require('./routes/classes'));
app.use('/api/students',    require('./routes/students'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/attendance',  require('./routes/attendance'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/dashboard',   require('./routes/dashboard'));
app.use('/api/reports',     require('./routes/reports'));

app.get('/api/health', (req, res) => res.json({ status: 'Server running', db: 'PostgreSQL' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
