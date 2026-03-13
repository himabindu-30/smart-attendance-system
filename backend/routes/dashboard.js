const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middleware/auth");

/*
========================================
Simple In-Memory Cache (5 min)
========================================
*/
const cache = {};

function setCache(key, data) {
  cache[key] = {
    data,
    expiry: Date.now() + 5 * 60 * 1000,
  };
}

function getCache(key) {
  const item = cache[key];
  if (!item) return null;
  if (Date.now() > item.expiry) {
    delete cache[key];
    return null;
  }
  return item.data;
}

/*
========================================
GET DASHBOARD STATS
========================================
*/
router.get("/stats", auth, async (req, res) => {
  try {
    const cached = getCache("stats");
    if (cached) return res.json(cached);

    const [[students]] = await db.query(
      `SELECT COUNT(*) AS total_students FROM students`
    );

    const [[classes]] = await db.query(
      `SELECT COUNT(*) AS total_classes FROM classes`
    );

    const [[sessions]] = await db.query(
      `
      SELECT COUNT(DISTINCT date) AS todays_sessions
      FROM attendance
      WHERE DATE(date) = CURDATE()
      `
    );

    const [[avg]] = await db.query(
      `
      SELECT 
      ROUND(SUM(status='present') / COUNT(*) * 100, 2) 
      AS average_attendance
      FROM attendance
      `
    );

    const result = {
      total_students: students.total_students,
      total_classes: classes.total_classes,
      todays_sessions: sessions.todays_sessions,
      average_attendance: avg.average_attendance || 0,
    };

    setCache("stats", result);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

/*
========================================
MONTHLY TREND (LAST 6 MONTHS)
========================================
*/
router.get("/monthly-trend", auth, async (req, res) => {
  try {
    const cached = getCache("monthly");
    if (cached) return res.json(cached);

    const [rows] = await db.query(
      `
      SELECT 
        DATE_FORMAT(date,'%b') AS month,
        ROUND(SUM(status='present')/COUNT(*)*100,2) AS percentage
      FROM attendance
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY YEAR(date), MONTH(date)
      ORDER BY YEAR(date), MONTH(date)
      `
    );

    setCache("monthly", rows);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Monthly trend error" });
  }
});

/*
========================================
SUBJECT WISE ATTENDANCE
========================================
*/
router.get("/subject-wise", auth, async (req, res) => {
  try {
    const cached = getCache("subject");
    if (cached) return res.json(cached);

    const [rows] = await db.query(
      `
      SELECT 
        sub.name AS subject,
        ROUND(SUM(a.status='present')/COUNT(*)*100,2) AS percentage
      FROM attendance a
      JOIN subjects sub ON sub.id = a.subject_id
      GROUP BY a.subject_id
      ORDER BY percentage DESC
      `
    );

    setCache("subject", rows);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Subject analytics error" });
  }
});

/*
========================================
RECENT SESSIONS
========================================
*/
router.get("/recent-sessions", auth, async (req, res) => {
  try {
    const cached = getCache("recent");
    if (cached) return res.json(cached);

    const [rows] = await db.query(
      `
      SELECT 
        a.date,
        c.name AS class_name,
        f.name AS faculty_name,
        SUM(a.status='present') AS present_count,
        SUM(a.status='absent') AS absent_count,
        ROUND(SUM(a.status='present')/COUNT(*)*100,2) AS percentage
      FROM attendance a
      JOIN classes c ON c.id = a.class_id
      JOIN faculty f ON f.id = c.faculty_id
      GROUP BY a.date, a.class_id
      ORDER BY a.date DESC
      LIMIT 10
      `
    );

    setCache("recent", rows);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Recent sessions error" });
  }
});

module.exports = router;