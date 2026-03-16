const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const upload = multer({ storage: multer.memoryStorage() });
const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// ─── MANUAL: save roll-call checklist ────────────────────────────────────────
router.post('/manual', auth, async (req, res) => {
  if (req.user.role === 'STUDENT') return res.status(403).json({ error: 'Access denied' });
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { class_id, records, session_date } = req.body;
    // records: [{ student_id, status }]
    if (!class_id || !records?.length)
      return res.status(400).json({ error: 'class_id and records required' });

    const date = session_date || new Date().toISOString().slice(0, 10);

    const { rows: [sess] } = await client.query(
      `INSERT INTO attendance_sessions (class_id, session_date, start_time, method)
       VALUES ($1, $2, CURRENT_TIME, 'MANUAL') RETURNING session_id`,
      [class_id, date]
    );

    for (const r of records) {
      await client.query(
        'INSERT INTO attendance (session_id, student_id, status) VALUES ($1, $2, $3)',
        [sess.session_id, r.student_id, r.status]
      );
    }

    await client.query('COMMIT');
    const present = records.filter(r => r.status === 'PRESENT').length;
    res.json({ success: true, session_id: sess.session_id, present_count: present, absent_count: records.length - present });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to save attendance' });
  } finally {
    client.release();
  }
});

// ─── LIVE ANALYZE: scan photo → return checklist (don't save yet) ────────────
router.post('/analyze', auth, upload.single('photo'), async (req, res) => {
  if (req.user.role === 'STUDENT') return res.status(403).json({ error: 'Access denied' });
  try {
    const { class_id } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Photo required' });
    if (!class_id) return res.status(400).json({ error: 'class_id required' });

    // Get enrolled students with face encodings
    const { rows: students } = await db.query(`
      SELECT s.student_id, u.name, s.roll_number, fe.face_vector AS encoding
      FROM enrollments e
      JOIN students s ON s.student_id = e.student_id
      JOIN users u ON u.user_id = s.user_id
      LEFT JOIN face_encodings fe ON fe.student_id = s.student_id
      WHERE e.class_id = $1
      ORDER BY s.roll_number
    `, [class_id]);

    if (!students.length) return res.status(400).json({ error: 'No enrolled students' });

    // Students who have face encodings
    const withFace = students.filter(s => s.encoding);

    let matchedIds = new Set();

    if (withFace.length > 0) {
      const enrolled = withFace.map(s => ({
        student_id: s.student_id,
        name: s.name,
        encoding: typeof s.encoding === 'string' ? JSON.parse(s.encoding) : s.encoding
      }));

      const formData = new FormData();
      formData.append('photo', req.file.buffer, { filename: 'photo.jpg', contentType: req.file.mimetype });
      formData.append('enrolled_students', JSON.stringify(enrolled));

      const mlRes = await axios.post(`${ML_URL}/match-faces`, formData, {
        headers: formData.getHeaders(),
        timeout: 30000
      });

      (mlRes.data.matches || []).forEach(m => matchedIds.add(m.student_id));
    }

    // Build checklist: identified → PRESENT, rest → ABSENT
    const checklist = students.map(s => ({
      student_id: s.student_id,
      name: s.name,
      roll_number: s.roll_number,
      status: matchedIds.has(s.student_id) ? 'PRESENT' : 'ABSENT',
      has_face: !!s.encoding,
    }));

    res.json({ success: true, checklist });
  } catch (err) {
    console.error('Analyze error:', err.message);
    res.status(500).json({ error: err.message || 'Face analysis failed' });
  }
});

// ─── LIVE CONFIRM: save after faculty edits checklist ────────────────────────
router.post('/confirm', auth, async (req, res) => {
  if (req.user.role === 'STUDENT') return res.status(403).json({ error: 'Access denied' });
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { class_id, records, session_date } = req.body;
    if (!class_id || !records?.length)
      return res.status(400).json({ error: 'class_id and records required' });

    const date = session_date || new Date().toISOString().slice(0, 10);

    const { rows: [sess] } = await client.query(
      `INSERT INTO attendance_sessions (class_id, session_date, start_time, method)
       VALUES ($1, $2, CURRENT_TIME, 'LIVE') RETURNING session_id`,
      [class_id, date]
    );

    for (const r of records) {
      await client.query(
        'INSERT INTO attendance (session_id, student_id, status, confidence) VALUES ($1, $2, $3, $4)',
        [sess.session_id, r.student_id, r.status, r.confidence || null]
      );
    }

    await client.query('COMMIT');
    const present = records.filter(r => r.status === 'PRESENT').length;
    res.json({ success: true, session_id: sess.session_id, present_count: present, absent_count: records.length - present });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to confirm attendance' });
  } finally {
    client.release();
  }
});

// ─── HISTORY for a class ─────────────────────────────────────────────────────
router.get('/history/:class_id', auth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT asess.session_id, asess.session_date, asess.method,
             u.name AS student_name, s.roll_number, a.status, a.confidence
      FROM attendance a
      JOIN attendance_sessions asess ON asess.session_id = a.session_id
      JOIN students s ON s.student_id = a.student_id
      JOIN users u ON u.user_id = s.user_id
      WHERE asess.class_id = $1
      ORDER BY asess.session_date DESC, s.roll_number
    `, [req.params.class_id]);
    res.json({ success: true, records: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ─── STUDENT: own attendance ──────────────────────────────────────────────────
router.get('/my', auth, async (req, res) => {
  try {
    const { rows: [student] } = await db.query(
      'SELECT student_id FROM students WHERE user_id = $1', [req.user.user_id]
    );
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const { rows } = await db.query(`
      SELECT c.subject_name,
             COUNT(*) AS total_classes,
             SUM(CASE WHEN a.status='PRESENT' THEN 1 ELSE 0 END) AS present,
             ROUND(SUM(CASE WHEN a.status='PRESENT' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*),0), 1) AS percentage,
             MAX(asess.session_date) AS last_class
      FROM attendance a
      JOIN attendance_sessions asess ON asess.session_id = a.session_id
      JOIN classes c ON c.class_id = asess.class_id
      WHERE a.student_id = $1
      GROUP BY c.class_id, c.subject_name
      ORDER BY c.subject_name
    `, [student.student_id]);
    res.json({ success: true, attendance: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// ─── FACE REGISTER: encode and store student face ────────────────────────────
router.post('/register-face', auth, upload.single('photo'), async (req, res) => {
  if (req.user.role === 'STUDENT') return res.status(403).json({ error: 'Access denied' });
  try {
    const { student_id } = req.body;
    if (!req.file || !student_id) return res.status(400).json({ error: 'photo and student_id required' });

    const formData = new FormData();
    formData.append('photo', req.file.buffer, { filename: 'face.jpg', contentType: req.file.mimetype });

    const mlRes = await axios.post(`${ML_URL}/encode-face`, formData, {
      headers: formData.getHeaders(),
      timeout: 20000
    });

    if (!mlRes.data.success) return res.status(400).json({ error: mlRes.data.message });

    await db.query(
      `INSERT INTO face_encodings (student_id, face_vector)
       VALUES ($1, $2)
       ON CONFLICT (student_id) DO UPDATE SET face_vector = $2, created_at = NOW()`,
      [student_id, JSON.stringify(mlRes.data.encoding)]
    );

    res.json({ success: true, message: 'Face registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.response?.data?.message || 'Face registration failed' });
  }
});

module.exports = router;
