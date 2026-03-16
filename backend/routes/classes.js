const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// List classes — faculty sees only their own, admin sees all
router.get('/', auth, async (req, res) => {
  try {
    let query, params = [];
    if (req.user.role === 'FACULTY') {
      query = `
        SELECT c.class_id, c.subject_name, c.academic_year, c.section, c.schedule,
               u.name AS faculty_name,
               COUNT(e.student_id) AS student_count
        FROM classes c
        JOIN faculty f ON f.faculty_id = c.faculty_id
        JOIN users u ON u.user_id = f.user_id
        LEFT JOIN enrollments e ON e.class_id = c.class_id
        WHERE f.user_id = $1
        GROUP BY c.class_id, u.name
        ORDER BY c.class_id DESC`;
      params = [req.user.user_id];
    } else {
      query = `
        SELECT c.class_id, c.subject_name, c.academic_year, c.section, c.schedule,
               u.name AS faculty_name,
               COUNT(e.student_id) AS student_count
        FROM classes c
        JOIN faculty f ON f.faculty_id = c.faculty_id
        JOIN users u ON u.user_id = f.user_id
        LEFT JOIN enrollments e ON e.class_id = c.class_id
        GROUP BY c.class_id, u.name
        ORDER BY c.class_id DESC`;
    }
    const { rows } = await db.query(query, params);
    res.json({ success: true, classes: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT c.class_id, c.subject_name, c.academic_year, c.section, c.schedule,
             u.name AS faculty_name
      FROM classes c
      JOIN faculty f ON f.faculty_id = c.faculty_id
      JOIN users u ON u.user_id = f.user_id
      WHERE c.class_id = $1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Class not found' });
    res.json({ success: true, class: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { subject_name, academic_year, section, schedule, faculty_id: bodyFacultyId } = req.body;
    if (!subject_name || !academic_year || !section)
      return res.status(400).json({ error: 'subject_name, academic_year, section required' });

    let faculty_id;
    if (bodyFacultyId) {
      const { rows } = await db.query('SELECT faculty_id FROM faculty WHERE user_id = $1', [bodyFacultyId]);
      if (!rows.length) return res.status(400).json({ error: 'Not a faculty member' });
      faculty_id = rows[0].faculty_id;
    } else {
      const { rows } = await db.query('SELECT faculty_id FROM faculty WHERE user_id = $1', [req.user.user_id]);
      if (!rows.length) return res.status(403).json({ error: 'Only faculty can create classes' });
      faculty_id = rows[0].faculty_id;
    }

    const { rows } = await db.query(
      'INSERT INTO classes (subject_name, faculty_id, academic_year, section, schedule) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [subject_name, faculty_id, academic_year, section, schedule || null]
    );
    res.status(201).json({ success: true, class: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM classes WHERE class_id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

module.exports = router;
