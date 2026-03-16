const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  if (req.user.role === 'STUDENT') return res.status(403).json({ error: 'Access denied' });
  try {
    const { rows } = await db.query(
      'SELECT user_id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, users: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/faculty', auth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT u.user_id, u.name, u.email, f.department
      FROM users u JOIN faculty f ON f.user_id = u.user_id
      ORDER BY u.name
    `);
    res.json({ success: true, faculty: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch faculty' });
  }
});

router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { name, email, password, role, department, roll_number, year, section } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ error: 'name, email, password, role required' });

    const hash = await bcrypt.hash(password, 10);
    const { rows: [user] } = await client.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING user_id',
      [name, email, hash, role]
    );

    if (role === 'FACULTY') {
      await client.query(
        'INSERT INTO faculty (user_id, department) VALUES ($1, $2)',
        [user.user_id, department || 'General']
      );
    }
    if (role === 'STUDENT') {
      await client.query(
        'INSERT INTO students (user_id, roll_number, department, year, section) VALUES ($1,$2,$3,$4,$5)',
        [user.user_id, roll_number || `STU${user.user_id}`, department || 'General', year || 1, section || 'A']
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, user_id: user.user_id });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  } finally {
    client.release();
  }
});

router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
  try {
    const { name, email, role } = req.body;
    await db.query(
      'UPDATE users SET name=$1, email=$2, role=$3 WHERE user_id=$4',
      [name, email, role, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
  try {
    await db.query('DELETE FROM users WHERE user_id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
