const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");

const db = require("../config/db"); // mysql pool
const authMiddleware = require("../middleware/auth");

// store photo in memory
const upload = multer({ storage: multer.memoryStorage() });

/*
POST /api/attendance/capture
*/
router.post(
  "/capture",
  authMiddleware,
  upload.single("photo"),
  async (req, res) => {

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const { class_id } = req.body;
      const photo = req.file;

      if (!photo) {
        return res.status(400).json({
          success: false,
          message: "Photo required"
        });
      }

      if (!class_id) {
        return res.status(400).json({
          success: false,
          message: "class_id required"
        });
      }

      // ------------------------------------
      // a. Create attendance session
      // ------------------------------------
      const [sessionResult] = await connection.query(
        `INSERT INTO attendance_sessions 
         (class_id, created_by, created_at)
         VALUES (?, ?, NOW())`,
        [class_id, req.user.id]
      );

      const session_id = sessionResult.insertId;

      // ------------------------------------
      // b. Get enrolled students
      // ------------------------------------
      const [students] = await connection.query(
        `SELECT s.id as student_id,
                s.name,
                s.roll_no,
                fe.encoding
         FROM enrollments e
         JOIN students s ON s.id = e.student_id
         JOIN face_encodings fe ON fe.student_id = s.id
         WHERE e.class_id = ?`,
        [class_id]
      );

      if (students.length === 0) {
        throw new Error("No enrolled students");
      }

      // prepare ML payload
      const enrolledStudents = students.map(s => ({
        student_id: s.student_id,
        name: s.name,
        encoding: JSON.parse(s.encoding)
      }));

      // ------------------------------------
      // c. Call ML service
      // ------------------------------------
      const formData = new FormData();

      formData.append("photo", photo.buffer, {
        filename: photo.originalname,
        contentType: photo.mimetype
      });

      formData.append(
        "enrolled_students",
        JSON.stringify(enrolledStudents)
      );

      const mlResponse = await axios.post(
        "http://localhost:5001/match-faces",
        formData,
        {
          headers: formData.getHeaders()
        }
      );

      const matches = mlResponse.data.matches || [];

      const matchedMap = {};
      matches.forEach(m => {
        matchedMap[m.student_id] = m.confidence;
      });

      // ------------------------------------
      // d/e/f. Insert attendance records
      // ------------------------------------
      const results = [];

      for (const s of students) {

        const isPresent = matchedMap[s.student_id];

        const status = isPresent ? "PRESENT" : "ABSENT";

        await connection.query(
          `INSERT INTO attendance 
           (session_id, student_id, status, confidence)
           VALUES (?, ?, ?, ?)`,
          [
            session_id,
            s.student_id,
            status,
            isPresent || null
          ]
        );

        results.push({
          student_id: s.student_id,
          name: s.name,
          status,
          confidence: isPresent || 0
        });
      }

      await connection.commit();

      const present_count = results.filter(
        r => r.status === "PRESENT"
      ).length;

      const absent_count = results.length - present_count;

      return res.json({
        success: true,
        session_id,
        present_count,
        absent_count,
        students: results
      });

    } catch (err) {

      await connection.rollback();

      console.error("Attendance capture error:", err);

      return res.status(500).json({
        success: false,
        message: err.message || "Attendance processing failed"
      });

    } finally {
      connection.release();
    }
  }
);

module.exports = router;