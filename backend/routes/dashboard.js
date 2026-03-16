const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

router.get('/stats', auth, async (req, res) => {
  try {
    const [s, c, sess, avg] = await Promise.all([
      db.query('SELECT COUNT(*) AS total FROM students'),
      db.query('SELECT COUNT(*) AS total FROM classes'),
      db.query("SELECT COUNT(DISTINCT session_id) AS total FROM attendance_sessions WHERE session_date = CURRENT_DATE"),
      db.query("SELECT ROUND(SUM(CASE WHEN status='PRESENT' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*),0), 2) AS avg FROM attendance"),
    ]);
    res.json({
      total_students: parseInt(s.rows[0].total),
      total_classes: parseInt(c.rows[0].total),
      todays_sessions: parseInt(sess.rows[0].total),
      average_attendance: parseFloat(avg.rows[0].avg) || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

router.get('/monthly-trend', auth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT TO_CHAR(asess.session_date, 'Mon') AS month,
             ROUND(SUM(CASE WHEN a.status='PRESENT' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*),0), 2) AS percentage
      FROM attendance a
      JOIN attendance_sessions asess ON asess.session_id = a.session_id
      WHERE asess.session_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(asess.session_date, 'YYYY-MM'), TO_CHAR(asess.session_date, 'Mon')
      ORDER BY TO_CHAR(asess.session_date, 'YYYY-MM')
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Monthly trend error' });
  }
});

router.get('/subject-wise', auth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT c.subject_name AS subject,
             ROUND(SUM(CASE WHEN a.status='PRESENT' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*),0), 2) AS percentage
      FROM attendance a
      JOIN attendance_sessions asess ON asess.session_id = a.session_id
      JOIN classes c ON c.class_id = asess.class_id
      GROUP BY c.class_id, c.subject_name
      ORDER BY percentage DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Subject analytics error' });
  }
});

router.get('/recent-sessions', auth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT asess.session_date AS date,
             c.subject_name AS class_name,
             u.name AS faculty_name,
             SUM(CASE WHEN a.status='PRESENT' THEN 1 ELSE 0 END) AS present_count,
             SUM(CASE WHEN a.status='ABSENT' THEN 1 ELSE 0 END) AS absent_count,
             ROUND(SUM(CASE WHEN a.status='PRESENT' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*),0), 2) AS percentage
      FROM attendance a
      JOIN attendance_sessions asess ON asess.session_id = a.session_id
      JOIN classes c ON c.class_id = asess.class_id
      JOIN faculty f ON f.faculty_id = c.faculty_id
      JOIN users u ON u.user_id = f.user_id
      GROUP BY asess.session_id, asess.session_date, c.subject_name, u.name
      ORDER BY asess.session_date DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Recent sessions error' });
  }
});

module.exports = router;
