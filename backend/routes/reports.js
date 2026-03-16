const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const db = require('../config/db');
const auth = require('../middleware/auth');

function buildQuery(base, { class_id, start_date, end_date }) {
  const params = [];
  let q = base + ' WHERE 1=1';
  if (class_id)   { params.push(class_id);   q += ` AND asess.class_id = $${params.length}`; }
  if (start_date) { params.push(start_date); q += ` AND asess.session_date >= $${params.length}`; }
  if (end_date)   { params.push(end_date);   q += ` AND asess.session_date <= $${params.length}`; }
  q += ' ORDER BY asess.session_date DESC';
  return { q, params };
}

const BASE = `
  SELECT u.name AS student_name, s.roll_number, c.subject_name,
         asess.session_date, a.status, a.confidence
  FROM attendance a
  JOIN attendance_sessions asess ON asess.session_id = a.session_id
  JOIN students s ON s.student_id = a.student_id
  JOIN users u ON u.user_id = s.user_id
  JOIN classes c ON c.class_id = asess.class_id`;

router.get('/', auth, async (req, res) => {
  try {
    const { q, params } = buildQuery(BASE, req.query);
    const { rows } = await db.query(q, params);
    res.json({ success: true, records: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

router.get('/export/pdf', auth, async (req, res) => {
  try {
    const { q, params } = buildQuery(BASE, req.query);
    const { rows: records } = await db.query(q, params);

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.pdf');
    doc.pipe(res);
    doc.fontSize(18).text('Smart Attendance System', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown();
    const top = doc.y;
    ['Date', 'Student', 'Roll No', 'Subject', 'Status'].forEach((h, i) =>
      doc.text(h, 40 + i * 105, top, { width: 100, underline: true })
    );
    let y = top + 20;
    records.forEach(r => {
      doc.text(String(r.session_date).slice(0, 10), 40,  y, { width: 100 });
      doc.text(r.student_name || '-',               145, y, { width: 100 });
      doc.text(r.roll_number  || '-',               250, y, { width: 100 });
      doc.text(r.subject_name || '-',               355, y, { width: 100 });
      doc.text(r.status       || '-',               460, y, { width: 80  });
      y += 20;
      if (y > 720) { doc.addPage(); y = 40; }
    });
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

router.get('/export/excel', auth, async (req, res) => {
  try {
    const { q, params } = buildQuery(BASE, req.query);
    const { rows } = await db.query(q, params);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendance');
    const header = sheet.addRow(['Date', 'Student', 'Roll No', 'Subject', 'Status', 'Confidence']);
    header.font = { bold: true };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDEEFF' } };
    rows.forEach(r => sheet.addRow([
      String(r.session_date).slice(0, 10),
      r.student_name, r.roll_number, r.subject_name, r.status, r.confidence
    ]));
    sheet.columns.forEach(col => { col.width = 20; });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Excel generation failed' });
  }
});

module.exports = router;
