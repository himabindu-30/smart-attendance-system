import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

const jsonHdr = () => ({ 'Content-Type': 'application/json' });

// ── Stages ────────────────────────────────────────────────────────────────────
const STAGE = { CAMERA: 'camera', ANALYZING: 'analyzing', CHECKLIST: 'checklist', DONE: 'done' };

export default function LiveAttendance() {
  const { id: class_id } = useParams();
  const navigate = useNavigate();

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [classInfo,  setClassInfo]  = useState(null);
  const [stage,      setStage]      = useState(STAGE.CAMERA);
  const [captured,   setCaptured]   = useState(null);   // blob URL for preview
  const [capturedFile, setCapturedFile] = useState(null);
  const [checklist,  setChecklist]  = useState([]);
  const [date,       setDate]       = useState(new Date().toISOString().slice(0, 10));
  const [error,      setError]      = useState('');
  const [saving,     setSaving]     = useState(false);
  const [result,     setResult]     = useState(null);
  const [camReady,   setCamReady]   = useState(false);

  // Load class info
  useEffect(() => {
    api(`/api/classes/${class_id}`)
      .then(r => r.json()).then(d => setClassInfo(d.class));
  }, [class_id]);

  // Start camera
  useEffect(() => {
    if (stage !== STAGE.CAMERA) return;
    navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCamReady(true);
      })
      .catch(() => setError('Camera access denied. Please allow camera permission.'));

    return () => stopCamera();
  }, [stage]); // eslint-disable-line

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCamReady(false);
  };

  // Capture photo from video
  const capturePhoto = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      const file = new File([blob], 'attendance.jpg', { type: 'image/jpeg' });
      setCaptured(URL.createObjectURL(blob));
      setCapturedFile(file);
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  const retake = () => {
    setCaptured(null);
    setCapturedFile(null);
    setError('');
    setStage(STAGE.CAMERA);
  };

  // Send photo to backend → get checklist
  const analyze = async () => {
    setStage(STAGE.ANALYZING);
    setError('');
    try {
      const form = new FormData();
      form.append('photo', capturedFile);
      form.append('class_id', class_id);

      const res  = await api('/api/attendance/analyze', {
        method: 'POST', body: form
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');

      setChecklist(data.checklist);
      setStage(STAGE.CHECKLIST);
    } catch (err) {
      setError(err.message);
      setStage(STAGE.CAMERA);
    }
  };

  const toggleStatus = (i) =>
    setChecklist(prev => prev.map((s, idx) =>
      idx === i ? { ...s, status: s.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' } : s
    ));

  // Save confirmed checklist
  const confirm = async () => {
    setSaving(true); setError('');
    try {
      const res = await api('/api/attendance/confirm', {
        method: 'POST',
        headers: jsonHdr(),
        body: JSON.stringify({
          class_id,
          session_date: date,
          records: checklist.map(s => ({ student_id: s.student_id, status: s.status }))
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ present: data.present_count, absent: data.absent_count });
      setStage(STAGE.DONE);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const present = checklist.filter(s => s.status === 'PRESENT').length;
  const absent  = checklist.length - present;

  return (
    <div style={S.page}>
      <div style={S.container}>

        {/* Header */}
        <div style={S.header}>
          <div>
            <div style={S.eyebrow}>Live Face Attendance</div>
            <h1 style={S.title}>{classInfo?.subject_name || '...'}</h1>
            <div style={S.meta}>{classInfo?.section} · {classInfo?.faculty_name}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={S.dateInput} />
            <button onClick={() => navigate('/classes')} style={S.btnSecondary}>← Back</button>
          </div>
        </div>

        {error && <div style={S.errorBox}>{error}</div>}

        {/* ── STAGE: CAMERA ── */}
        {(stage === STAGE.CAMERA) && (
          <div style={S.card}>
            <h2 style={S.cardTitle}>📷 Capture Classroom Photo</h2>
            <p style={S.hint}>Position the camera to capture all students' faces, then click Capture.</p>
            {!captured ? (
              <>
                <video ref={videoRef} autoPlay playsInline style={S.video} />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div style={S.btnRow}>
                  <button onClick={capturePhoto} disabled={!camReady} style={S.btnPrimary}>
                    📸 Capture Photo
                  </button>
                </div>
              </>
            ) : (
              <>
                <img src={captured} alt="captured" style={S.video} />
                <div style={S.btnRow}>
                  <button onClick={retake} style={S.btnSecondary}>🔄 Retake</button>
                  <button onClick={analyze} style={S.btnAmber}>🔍 Analyze Faces</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STAGE: ANALYZING ── */}
        {stage === STAGE.ANALYZING && (
          <div style={{ ...S.card, textAlign: 'center', padding: 60 }}>
            <div style={S.spinner} />
            <p style={{ marginTop: 20, color: '#555', fontSize: 15 }}>
              Analyzing faces with DeepFace… this may take a few seconds.
            </p>
          </div>
        )}

        {/* ── STAGE: CHECKLIST ── */}
        {stage === STAGE.CHECKLIST && (
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={S.cardTitle}>📋 Attendance Checklist</h2>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={S.presentBadge}>Present: {present}</span>
                <span style={S.absentBadge}>Absent: {absent}</span>
              </div>
            </div>
            <p style={S.hint}>
              ✅ Identified faces are marked <b>Present</b>. Unrecognised students are <b>Absent</b>.
              You can edit before saving.
            </p>

            <table style={S.table}>
              <thead>
                <tr style={S.thead}>
                  <th style={S.th}>#</th>
                  <th style={S.th}>Roll No</th>
                  <th style={S.th}>Name</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>Face Registered</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>Status</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>Edit</th>
                </tr>
              </thead>
              <tbody>
                {checklist.map((s, i) => (
                  <tr key={s.student_id} style={{ background: s.status === 'PRESENT' ? '#f0fdf4' : '#fff5f5', borderBottom: '1px solid #e8e0d0' }}>
                    <td style={S.td}>{i + 1}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{s.roll_number}</td>
                    <td style={S.td}>{s.name}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      {s.has_face ? <span style={{ color: '#16a34a' }}>✓</span> : <span style={{ color: '#dc2626' }}>✗</span>}
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <span style={s.status === 'PRESENT' ? S.presentBadge : S.absentBadge}>
                        {s.status === 'PRESENT' ? '✓ Present' : '✗ Absent'}
                      </span>
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <button
                        onClick={() => toggleStatus(i)}
                        style={s.status === 'PRESENT' ? S.toggleAbsent : S.togglePresent}
                      >
                        {s.status === 'PRESENT' ? 'Mark Absent' : 'Mark Present'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
              <button onClick={retake} style={S.btnSecondary}>🔄 Retake Photo</button>
              <button onClick={confirm} disabled={saving} style={S.btnPrimary}>
                {saving ? 'Saving...' : '💾 Confirm & Save'}
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE: DONE ── */}
        {stage === STAGE.DONE && (
          <div style={{ ...S.card, textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 52 }}>✅</div>
            <h2 style={{ margin: '12px 0 6px' }}>Attendance Saved!</h2>
            <p style={{ color: '#555', marginBottom: 24 }}>
              Present: <b style={{ color: '#16a34a' }}>{result?.present}</b> &nbsp;|&nbsp;
              Absent: <b style={{ color: '#dc2626' }}>{result?.absent}</b>
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => navigate('/classes')} style={S.btnSecondary}>← Classes</button>
              <button onClick={() => { setStage(STAGE.CAMERA); setCaptured(null); setChecklist([]); setResult(null); }} style={S.btnPrimary}>
                Take Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const C = { dark: '#1a1209', amber: '#d97706', border: '#e8e0d0', cream: '#fdf8f0' };

const S = {
  page:         { minHeight: '100vh', background: C.cream, padding: '32px 24px', fontFamily: "'DM Sans', sans-serif" },
  container:    { maxWidth: 1000, margin: '0 auto' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  eyebrow:      { fontSize: 11, color: C.amber, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 },
  title:        { margin: 0, fontSize: 28, fontWeight: 700, color: C.dark },
  meta:         { fontSize: 13, color: '#8a7a65', marginTop: 4 },
  dateInput:    { padding: '7px 10px', border: `1.5px solid ${C.border}`, borderRadius: 7, fontSize: 14, outline: 'none' },
  card:         { background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 28 },
  cardTitle:    { margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: C.dark },
  hint:         { fontSize: 13, color: '#8a7a65', marginBottom: 16 },
  video:        { width: '100%', borderRadius: 10, border: `1.5px solid ${C.border}`, maxHeight: 420, objectFit: 'cover' },
  btnRow:       { display: 'flex', gap: 12, marginTop: 16, justifyContent: 'center' },
  table:        { width: '100%', borderCollapse: 'collapse' },
  thead:        { background: '#faf7f2' },
  th:           { padding: '11px 14px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#8a7a65', borderBottom: `1.5px solid ${C.border}`, textAlign: 'left', letterSpacing: '0.06em' },
  td:           { padding: '12px 14px', fontSize: 14 },
  errorBox:     { background: '#fef2f2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 16 },
  presentBadge: { background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  absentBadge:  { background: '#fee2e2', color: '#991b1b', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  btnPrimary:   { background: C.dark, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { background: 'transparent', color: C.dark, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '9px 18px', fontSize: 14, cursor: 'pointer' },
  btnAmber:     { background: C.amber, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  togglePresent:{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' },
  toggleAbsent: { background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' },
  spinner:      { width: 44, height: 44, border: '4px solid #e8e0d0', borderTopColor: C.amber, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' },
};
