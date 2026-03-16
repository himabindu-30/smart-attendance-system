const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

router.get('/:class_id', auth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT s.student_id, u.name, s.roll_number, s.department, s.year, s.section
      FROM enrollments e
      JOIN students s ON s.student_id = e.student_id
      JOIN users u ON u.user_id = s.user_id
      WHERE e.class_id = $1
      ORDER BY s.roll_number
    `, [req.params.class_id]);
    res.json({ success: true, students: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { student_id, class_id } = req.body;
    await db.query(
      'INSERT INTO enrollments (student_id, class_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [student_id, class_id]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to enroll student' });
  }
});

router.delete('/:class_id/:student_id', auth, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM enrollments WHERE class_id = $1 AND student_id = $2',
      [req.params.class_id, req.params.student_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unenroll student' });
  }
});

module.exports = router;
