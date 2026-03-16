const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT s.student_id, u.name, s.roll_number, s.department, s.year, s.section,
             EXISTS(SELECT 1 FROM face_encodings fe WHERE fe.student_id = s.student_id) AS has_face
      FROM students s
      JOIN users u ON u.user_id = s.user_id
      ORDER BY s.roll_number
    `);
    res.json({ success: true, students: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

module.exports = router;
