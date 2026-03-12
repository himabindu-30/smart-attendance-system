import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EnrollStudents.css';

function EnrollStudents() {
  const { id } = useParams(); // Get class_id from URL
  const navigate = useNavigate();
  
  const [classInfo, setClassInfo] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch class info
      const classRes = await axios.get(`http://localhost:5000/api/classes/${id}`, { headers });
      setClassInfo(classRes.data.class);

      // Fetch enrolled students
      const enrolledRes = await axios.get(`http://localhost:5000/api/classes/${id}/students`, { headers });
      setEnrolledStudents(enrolledRes.data.students || []);

      // Fetch available students
      const availableRes = await axios.get(`http://localhost:5000/api/classes/${id}/available-students`, { headers });
      setAvailableStudents(availableRes.data.students || []);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const handleSelectStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleEnroll = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/enrollments', {
        student_ids: selectedStudents,
        class_id: id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Students enrolled successfully!');
      setSelectedStudents([]);
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Error enrolling students:', err);
      alert('Failed to enroll students');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="enroll-container">
      <div className="enroll-header">
        <div>
          <h1>Enroll Students</h1>
          {classInfo && (
            <p className="class-info">
              {classInfo.subject_name} - Section {classInfo.section} ({classInfo.academic_year})
            </p>
          )}
        </div>
        <button onClick={() => navigate('/classes')} className="btn-back">
          ← Back to Classes
        </button>
      </div>

      <div className="enroll-grid">
        {/* Available Students */}
        <div className="student-section">
          <div className="section-header">
            <h2>Available Students</h2>
            <span className="count">{availableStudents.length} students</span>
          </div>

          {selectedStudents.length > 0 && (
            <button onClick={handleEnroll} className="btn-enroll">
              Enroll {selectedStudents.length} Selected Student{selectedStudents.length > 1 ? 's' : ''}
            </button>
          )}

          <div className="student-list">
            {availableStudents.length === 0 ? (
              <p className="empty">All students are already enrolled!</p>
            ) : (
              availableStudents.map(student => (
                <div
                  key={student.student_id}
                  className={`student-card ${selectedStudents.includes(student.student_id) ? 'selected' : ''}`}
                  onClick={() => handleSelectStudent(student.student_id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.student_id)}
                    onChange={() => {}}
                  />
                  <div className="student-info">
                    <h3>{student.name}</h3>
                    <p>Roll: {student.roll_number}</p>
                    <p>{student.department} - Year {student.year}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Enrolled Students */}
        <div className="student-section">
          <div className="section-header">
            <h2>Enrolled Students</h2>
            <span className="count">{enrolledStudents.length} students</span>
          </div>

          <div className="student-list">
            {enrolledStudents.length === 0 ? (
              <p className="empty">No students enrolled yet.</p>
            ) : (
              enrolledStudents.map(student => (
                <div key={student.student_id} className="student-card enrolled">
                  <div className="student-info">
                    <h3>{student.name}</h3>
                    <p>Roll: {student.roll_number}</p>
                    <p>{student.department} - Year {student.year}</p>
                  </div>
                  <span className="enrolled-badge">✓ Enrolled</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnrollStudents;