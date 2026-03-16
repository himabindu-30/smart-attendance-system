import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function TakeAttendance() {
  const { id: class_id } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);

  useEffect(() => {
    api(`/api/classes/${class_id}`)
      .then(r => r.json()).then(d => setClassInfo(d.class));
  }, [class_id]);

  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={S.eyebrow}>Take Attendance</div>
        <h1 style={S.title}>{classInfo?.subject_name || '...'}</h1>
        <p style={S.sub}>{classInfo?.section} · {classInfo?.faculty_name}</p>

        <div style={S.grid}>
          {/* Manual */}
          <div style={S.card} onClick={() => navigate(`/classes/${class_id}/attendance/manual`)}>
            <div style={S.icon}>📋</div>
            <h2 style={S.cardTitle}>Manual</h2>
            <p style={S.cardDesc}>
              Roll-call checklist — mark each student present or absent by name.
              Works offline, no camera needed.
            </p>
            <div style={S.badge}>EduNext style</div>
          </div>

          {/* Live */}
          <div style={S.card} onClick={() => navigate(`/classes/${class_id}/attendance/live`)}>
            <div style={S.icon}>📷</div>
            <h2 style={S.cardTitle}>Live Face Recognition</h2>
            <p style={S.cardDesc}>
              Capture a classroom photo, click Analyze — DeepFace identifies students
              automatically. Edit the checklist, then confirm.
            </p>
            <div style={{ ...S.badge, background: '#fef3c7', color: '#92400e' }}>AI powered</div>
          </div>
        </div>

        <button onClick={() => navigate('/classes')} style={S.back}>← Back to Classes</button>
      </div>
    </div>
  );
}

const C = { dark: '#1a1209', amber: '#d97706', border: '#e8e0d0', cream: '#fdf8f0' };

const S = {
  page:      { minHeight: '100vh', background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" },
  container: { maxWidth: 700, width: '100%', padding: '0 24px', textAlign: 'center' },
  eyebrow:   { fontSize: 11, color: C.amber, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 },
  title:     { margin: '0 0 6px', fontSize: 32, fontWeight: 700, color: C.dark },
  sub:       { color: '#8a7a65', fontSize: 14, marginBottom: 36 },
  grid:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 },
  card:      { background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 16, padding: 32, cursor: 'pointer', textAlign: 'left', transition: 'box-shadow 0.2s', ':hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' } },
  icon:      { fontSize: 36, marginBottom: 14 },
  cardTitle: { margin: '0 0 10px', fontSize: 18, fontWeight: 700, color: C.dark },
  cardDesc:  { fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 16 },
  badge:     { display: 'inline-block', background: '#dcfce7', color: '#166534', padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  back:      { background: 'transparent', color: C.dark, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '9px 20px', fontSize: 14, cursor: 'pointer' },
};
