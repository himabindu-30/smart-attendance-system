import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api';

export default function FaceRegister() {
  const [students,   setStudents]   = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [file,       setFile]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState({ text: '', type: '' });
  const fileRef = useRef();

  useEffect(() => {
    api('/api/students')
      .then(r => r.json())
      .then(d => { setStudents(d.students || []); setLoading(false); });
  }, []);

  const onFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMsg({ text: '', type: '' });
  };

  const handleRegister = async () => {
    if (!selected || !file) return;
    setSaving(true); setMsg({ text: '', type: '' });
    try {
      const form = new FormData();
      form.append('photo', file);
      form.append('student_id', selected.student_id);

      const res  = await api('/api/attendance/register-face', {
        method: 'POST', body: form
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMsg({ text: `✅ Face registered for ${selected.name}`, type: 'success' });
      // refresh has_face flag
      setStudents(prev => prev.map(s =>
        s.student_id === selected.student_id ? { ...s, has_face: true } : s
      ));
      setSelected(null); setFile(null); setPreview(null);
    } catch (err) {
      setMsg({ text: `❌ ${err.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={S.eyebrow}>Admin · Face Registration</div>
        <h1 style={S.title}>Register Student Faces</h1>
        <p style={S.sub}>Upload a clear solo photo per student to enable live face attendance.</p>

        {msg.text && (
          <div style={msg.type === 'success' ? S.successBox : S.errorBox}>{msg.text}</div>
        )}

        <div style={S.layout}>
          {/* Student list */}
          <div style={S.listPanel}>
            <div style={S.panelHead}>Students ({students.length})</div>
            {loading ? <div style={S.center}>Loading...</div> : (
              <div style={S.list}>
                {students.map(s => (
                  <div
                    key={s.student_id}
                    onClick={() => { setSelected(s); setFile(null); setPreview(null); setMsg({ text: '', type: '' }); }}
                    style={{ ...S.studentRow, background: selected?.student_id === s.student_id ? '#fef3c7' : '#fff' }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: '#8a7a65' }}>{s.roll_number} · {s.section}</div>
                    </div>
                    {s.has_face
                      ? <span style={S.registered}>✓ Registered</span>
                      : <span style={S.notRegistered}>No face</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload panel */}
          <div style={S.uploadPanel}>
            {!selected ? (
              <div style={S.placeholder}>← Select a student to register their face</div>
            ) : (
              <>
                <div style={S.panelHead}>Registering: {selected.name} ({selected.roll_number})</div>

                <div
                  style={S.dropZone}
                  onClick={() => fileRef.current.click()}
                >
                  {preview
                    ? <img src={preview} alt="preview" style={S.preview} />
                    : <div style={{ textAlign: 'center', color: '#8a7a65' }}>
                        <div style={{ fontSize: 40 }}>📷</div>
                        <div style={{ marginTop: 8, fontSize: 14 }}>Click to upload photo</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>JPG / PNG · solo face · good lighting</div>
                      </div>
                  }
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />

                <button
                  onClick={handleRegister}
                  disabled={!file || saving}
                  style={{ ...S.btnPrimary, marginTop: 16, width: '100%', opacity: (!file || saving) ? 0.6 : 1 }}
                >
                  {saving ? 'Encoding & Saving...' : '🔐 Register Face'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const C = { dark: '#1a1209', amber: '#d97706', border: '#e8e0d0', cream: '#fdf8f0' };

const S = {
  page:          { minHeight: '100vh', background: C.cream, padding: '32px 24px', fontFamily: "'DM Sans', sans-serif" },
  container:     { maxWidth: 960, margin: '0 auto' },
  eyebrow:       { fontSize: 11, color: C.amber, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 },
  title:         { margin: '0 0 6px', fontSize: 28, fontWeight: 700, color: C.dark },
  sub:           { color: '#8a7a65', fontSize: 13, marginBottom: 24 },
  layout:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  listPanel:     { background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' },
  uploadPanel:   { background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 24 },
  panelHead:     { padding: '14px 18px', background: '#faf7f2', borderBottom: `1.5px solid ${C.border}`, fontSize: 13, fontWeight: 600, color: C.dark },
  list:          { maxHeight: 480, overflowY: 'auto' },
  studentRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer' },
  registered:    { background: '#dcfce7', color: '#166534', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  notRegistered: { background: '#fee2e2', color: '#991b1b', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  placeholder:   { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#8a7a65', fontSize: 14 },
  dropZone:      { border: `2px dashed ${C.border}`, borderRadius: 10, minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' },
  preview:       { width: '100%', maxHeight: 280, objectFit: 'cover' },
  btnPrimary:    { background: C.dark, color: '#fff', border: 'none', borderRadius: 8, padding: '11px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  successBox:    { background: '#dcfce7', color: '#166534', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorBox:      { background: '#fef2f2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 16 },
  center:        { padding: 40, textAlign: 'center', color: '#888' },
};
