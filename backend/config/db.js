const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool.connect()
  .then(client => { console.log('PostgreSQL connected'); client.release(); })
  .catch(err => console.error('DB connection error:', err.message));

module.exports = pool;
