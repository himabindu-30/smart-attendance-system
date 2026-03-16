-- PostgreSQL schema for Smart Attendance System
-- Run: psql -U postgres -f database.sql

CREATE DATABASE smart_attendance_db;
\c smart_attendance_db;

CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) CHECK (role IN ('ADMIN','FACULTY','STUDENT')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faculty (
  faculty_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  department VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS students (
  student_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  roll_number VARCHAR(20) NOT NULL UNIQUE,
  department VARCHAR(50),
  year INT,
  section VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS classes (
  class_id SERIAL PRIMARY KEY,
  subject_name VARCHAR(100),
  faculty_id INT REFERENCES faculty(faculty_id),
  academic_year VARCHAR(10),
  section VARCHAR(10),
  schedule VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS enrollments (
  enrollment_id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(student_id),
  class_id INT REFERENCES classes(class_id),
  UNIQUE(student_id, class_id)
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
  session_id SERIAL PRIMARY KEY,
  class_id INT REFERENCES classes(class_id),
  session_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  method VARCHAR(10) DEFAULT 'MANUAL' CHECK (method IN ('MANUAL','LIVE')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  attendance_id SERIAL PRIMARY KEY,
  session_id INT REFERENCES attendance_sessions(session_id) ON DELETE CASCADE,
  student_id INT REFERENCES students(student_id),
  status VARCHAR(10) CHECK (status IN ('PRESENT','ABSENT')),
  confidence DECIMAL(4,3),
  marked_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS face_encodings (
  encoding_id SERIAL PRIMARY KEY,
  student_id INT UNIQUE REFERENCES students(student_id) ON DELETE CASCADE,
  face_vector JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- SEED DATA (password: password123)
-- =====================
INSERT INTO users (user_id, name, email, password_hash, role) VALUES
(1, 'Test Admin',      'admin@test.com',        '$2b$10$5IrfX.4bccvk.rDY9rA6v..YQVC/bdqtGxENciUMXuo3FSCV5Hh7C', 'ADMIN'),
(2, 'Dr. Ravi Kumar',  'ravi@college.com',       '$2b$10$5IrfX.4bccvk.rDY9rA6v..YQVC/bdqtGxENciUMXuo3FSCV5Hh7C', 'FACULTY'),
(3, 'Dr. Priya Sharma','priya@college.com',      '$2b$10$5IrfX.4bccvk.rDY9rA6v..YQVC/bdqtGxENciUMXuo3FSCV5Hh7C', 'FACULTY'),
(4, 'Hima Bindu',      'hima@college.com',       '$2b$10$5IrfX.4bccvk.rDY9rA6v..YQVC/bdqtGxENciUMXuo3FSCV5Hh7C', 'STUDENT'),
(5, 'Ravi Teja',       'ravi.teja@college.com',  '$2b$10$5IrfX.4bccvk.rDY9rA6v..YQVC/bdqtGxENciUMXuo3FSCV5Hh7C', 'STUDENT'),
(6, 'Sai Kiran',       'sai@college.com',        '$2b$10$5IrfX.4bccvk.rDY9rA6v..YQVC/bdqtGxENciUMXuo3FSCV5Hh7C', 'STUDENT'),
(7, 'Divya Sri',       'divya@college.com',      '$2b$10$5IrfX.4bccvk.rDY9rA6v..YQVC/bdqtGxENciUMXuo3FSCV5Hh7C', 'STUDENT'),
(8, 'Arjun Rao',       'arjun@college.com',      '$2b$10$5IrfX.4bccvk.rDY9rA6v..YQVC/bdqtGxENciUMXuo3FSCV5Hh7C', 'STUDENT')
ON CONFLICT DO NOTHING;

SELECT setval('users_user_id_seq', 10);

INSERT INTO faculty (faculty_id, user_id, department) VALUES
(1, 2, 'Computer Science'),
(2, 3, 'Computer Science')
ON CONFLICT DO NOTHING;

SELECT setval('faculty_faculty_id_seq', 5);

INSERT INTO students (student_id, user_id, roll_number, department, year, section) VALUES
(1, 4, '22CS001', 'Computer Science', 3, 'A'),
(2, 5, '22CS002', 'Computer Science', 3, 'A'),
(3, 6, '22CS003', 'Computer Science', 3, 'A'),
(4, 7, '22CS004', 'Computer Science', 3, 'B'),
(5, 8, '22CS005', 'Computer Science', 3, 'B')
ON CONFLICT DO NOTHING;

SELECT setval('students_student_id_seq', 10);

INSERT INTO classes (class_id, subject_name, faculty_id, academic_year, section) VALUES
(1, 'Database Management Systems', 1, '2024-25', 'A'),
(2, 'Computer Networks',           1, '2024-25', 'A'),
(3, 'Operating Systems',           2, '2024-25', 'B'),
(4, 'Data Structures',             2, '2024-25', 'B')
ON CONFLICT DO NOTHING;

SELECT setval('classes_class_id_seq', 10);

INSERT INTO enrollments (student_id, class_id) VALUES
(1,1),(2,1),(3,1),
(1,2),(2,2),(3,2),
(4,3),(5,3),
(4,4),(5,4)
ON CONFLICT DO NOTHING;
