import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

const hdr = () => ({ 'Content-Type': 'application/json' });

export default function ManualAttendance() {
  const { id: class_id } = useParams();
  const navigate = useNavigate();

  const [classInfo, setClassInfo]   = useState(null);
  const [students,  setStudents]    = useState([]);
  const [date,      setDate]        = useState(new Date().toISOString().slice(0, 10));
  const [loading,   setLoading]     = useState(true);
  const [saving,    setSaving]      = useState(false);
  const [saved,     setSaved]       = useState(false);
  const [error,     setError]       = useState('');

  useEffect(() => {
    Promise.all([
      api(`/api/classes/${class_id}`).then(r => r.json()),
      api(`/api/enrollments/${class_id}`).then(r => r.json()),
    ]).then(([cls, enroll]) => {
      setClassInfo(cls.class);
      setStudents((enroll.students || []).map(s => ({ ...s, status: 'PRESENT' })));
      setLoading(false);
    }).catch(() => { setError('Failed to load'); setLoading(false); });
  }, [class_id]);

  const toggle = (i) =>
    setStudents(prev => prev.map((s, idx) =>
      idx === i ? { ...s, status: s.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' } : s
    ));

  const markAll = (status) => setStudents(prev => prev.map(s => ({ ...s, status })));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const res = await api('/api/attendance/manual', {
        method: 'POST',
        headers: hdr(),
        body: JSON.stringify({
          class_id,
          session_date: date,
          records: students.map(s => ({ student_id: s.student_id, status: s.status }))
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const present = students.filter(s => s.status === 'PRESENT').length;
  const absent  = students.length - present;

  if (loading) return <div style={styles.center}>Loading...</div>;

  if (saved) return (
    <div style={styles.page}>
      <div style={styles.successBox}>
        <div style={{ fontSize: 48 }}>✅</div>
        <h2 style={{ margin: '12px 0 4px' }}>Attendance Saved!</h2>
        <p style={{ color: '#555', margin: '0 0 20px' }}>
          Present: <b style={{ color: '#16a34a' }}>{present}</b> &nbsp;|&nbsp;
          Absent: <b style={{ color: '#dc2626' }}>{absent}</b>
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/classes')} style={styles.btnSecondary}>← Back to Classes</button>
          <button onClick={() => { setSaved(false); setStudents(s => s.map(x => ({ ...x, status: 'PRESENT' }))); }} style={styles.btnPrimary}>Take Again</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>Manual Attendance</div>
            <h1 style={styles.title}>{classInfo?.subject_name}</h1>
            <div style={styles.meta}>{classInfo?.section} · {classInfo?.faculty_name}</div>
          </div>
          <button onClick={() => navigate('/classes')} style={styles.btnSecondary}>← Back</button>
        </div>

        {/* Date + summary bar */}
        <div style={styles.toolbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={styles.label}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={styles.dateInput} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => markAll('PRESENT')} style={styles.btnGreen}>✓ All Present</button>
            <button onClick={() => markAll('ABSENT')}  style={styles.btnRed}>✗ All Absent</button>
          </div>
          <div style={styles.summary}>
            <span style={styles.presentBadge}>Present: {present}</span>
            <span style={styles.absentBadge}>Absent: {absent}</span>
          </div>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {/* Roll-call table */}
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Roll No</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Department</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Status</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Toggle</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.student_id} style={{ background: s.status === 'PRESENT' ? '#f0fdf4' : '#fff5f5', borderBottom: '1px solid #e8e0d0' }}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{s.roll_number}</td>
                  <td style={styles.td}>{s.name}</td>
                  <td style={{ ...styles.td, color: '#8a7a65' }}>{s.department}</td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <span style={s.status === 'PRESENT' ? styles.presentBadge : styles.absentBadge}>
                      {s.status === 'PRESENT' ? '✓ Present' : '✗ Absent'}
                    </span>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <button
                      onClick={() => toggle(i)}
                      style={s.status === 'PRESENT' ? styles.toggleAbsent : styles.togglePresent}
                    >
                      {s.status === 'PRESENT' ? 'Mark Absent' : 'Mark Present'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Save */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={handleSave} disabled={saving || !students.length} style={styles.btnPrimary}>
            {saving ? 'Saving...' : '💾 Save Attendance'}
          </button>
        </div>
      </div>
    </div>
  );
}

const C = { dark: '#1a1209', amber: '#d97706', border: '#e8e0d0', cream: '#fdf8f0' };

const styles = {
  page:          { minHeight: '100vh', background: C.cream, padding: '32px 24px', fontFamily: "'DM Sans', sans-serif" },
  container:     { maxWidth: 1000, margin: '0 auto' },
  center:        { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#888' },
  header:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  eyebrow:       { fontSize: 11, color: C.amber, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 },
  title:         { margin: 0, fontSize: 28, fontWeight: 700, color: C.dark },
  meta:          { fontSize: 13, color: '#8a7a65', marginTop: 4 },
  toolbar:       { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20 },
  label:         { fontSize: 12, fontWeight: 600, color: '#8a7a65', textTransform: 'uppercase' },
  dateInput:     { padding: '7px 10px', border: `1.5px solid ${C.border}`, borderRadius: 7, fontSize: 14, outline: 'none' },
  summary:       { marginLeft: 'auto', display: 'flex', gap: 10 },
  tableWrap:     { background: '#fff', borderRadius: 12, border: `1.5px solid ${C.border}`, overflow: 'hidden' },
  table:         { width: '100%', borderCollapse: 'collapse' },
  thead:         { background: '#faf7f2' },
  th:            { padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#8a7a65', borderBottom: `1.5px solid ${C.border}`, textAlign: 'left', letterSpacing: '0.06em' },
  td:            { padding: '13px 16px', fontSize: 14 },
  errorBox:      { background: '#fef2f2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 16 },
  successBox:    { maxWidth: 420, margin: '80px auto', background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 16, padding: 40, textAlign: 'center' },
  presentBadge:  { background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  absentBadge:   { background: '#fee2e2', color: '#991b1b', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  btnPrimary:    { background: C.dark, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSecondary:  { background: 'transparent', color: C.dark, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '9px 18px', fontSize: 14, cursor: 'pointer' },
  btnGreen:      { background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 13, cursor: 'pointer' },
  btnRed:        { background: '#dc2626', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 13, cursor: 'pointer' },
  togglePresent: { background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' },
  toggleAbsent:  { background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' },
};
