import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import './EnrollStudents.css';

function EnrollStudents() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      setLoading(true);
      const [enrolledRes, allRes] = await Promise.all([
        api(`/api/enrollments/${id}`),
        api(`/api/students`),
      ]);
      const enrolledData = await enrolledRes.json();
      const allData = await allRes.json();
      const enrolled = enrolledData.students || [];
      setEnrolledStudents(enrolled);
      const enrolledIds = new Set(enrolled.map(s => s.student_id));
      const available = (allData.students || []).filter(s => !enrolledIds.has(s.student_id));
      setAllStudents(available);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleEnroll = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }
    try {
      await Promise.all(
        selectedStudents.map(student_id =>
          api('/api/enrollments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id, class_id: id }),
          })
        )
      );
      alert('Students enrolled successfully!');
      setSelectedStudents([]);
      fetchData();
    } catch (err) {
      console.error('Error enrolling students:', err);
      alert('Failed to enroll students');
    }
  };

  const handleUnenroll = async (studentId) => {
    try {
      await api(`/api/enrollments/${id}/${studentId}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert('Failed to unenroll student');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="enroll-container">
      <div className="enroll-header">
        <div>
          <h1>Enroll Students</h1>
          <p className="class-info">Class ID: {id}</p>
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
            <span className="count">{allStudents.length} students</span>
          </div>

          {selectedStudents.length > 0 && (
            <button onClick={handleEnroll} className="btn-enroll">
              Enroll {selectedStudents.length} Selected Student{selectedStudents.length > 1 ? 's' : ''}
            </button>
          )}

          <div className="student-list">
            {allStudents.length === 0 ? (
              <p className="empty">All students are already enrolled!</p>
            ) : (
              allStudents.map(student => (
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="enrolled-badge">✓ Enrolled</span>
                    <button
                      onClick={() => handleUnenroll(student.student_id)}
                      style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}
                    >
                      Remove
                    </button>
                  </div>
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
