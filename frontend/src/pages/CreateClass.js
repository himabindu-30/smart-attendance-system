import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CreateClass = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    subject: '', faculty: '', section: '', schedule: '', room: '', description: '',
  });
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleDay = d => setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.subject || !form.faculty || !form.section) {
      setError('Subject, faculty, and section are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, days }),
      });
      if (!res.ok) throw new Error('Failed to create class');
      const data = await res.json();
      navigate(`/classes/${data.id}/enroll`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Back */}
        <button style={styles.backBtn} onClick={() => navigate('/classes')}>
          ← Back to Classes
        </button>

        <div style={styles.card}>
          {/* Left panel */}
          <div style={styles.leftPanel}>
            <div style={styles.eyebrow}>New Entry</div>
            <h1 style={styles.title}>Create<br /><em>Class</em></h1>
            <p style={styles.subtitle}>
              Set up a new class, assign faculty, and start enrolling students right away.
            </p>
            <div style={styles.decorLine} />
            <div style={styles.tip}>
              <span style={styles.tipIcon}>💡</span>
              After creating, you'll be taken directly to the enrollment page.
            </div>
          </div>

          {/* Form */}
          <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.grid2}>
              <Field label="Subject *" value={form.subject} onChange={v => set('subject', v)} placeholder="e.g. Mathematics 101" />
              <Field label="Section *" value={form.section} onChange={v => set('section', v)} placeholder="e.g. A, B, 3C" />
            </div>
            <Field label="Faculty *" value={form.faculty} onChange={v => set('faculty', v)} placeholder="Instructor's full name" />
            <div style={styles.grid2}>
              <Field label="Schedule / Time" value={form.schedule} onChange={v => set('schedule', v)} placeholder="e.g. 9:00 AM – 10:30 AM" />
              <Field label="Room" value={form.room} onChange={v => set('room', v)} placeholder="e.g. Lab 204" />
            </div>

            {/* Day picker */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Days</label>
              <div style={styles.dayRow}>
                {DAYS.map(d => (
                  <button
                    type="button"
                    key={d}
                    style={{ ...styles.dayBtn, ...(days.includes(d) ? styles.dayBtnActive : {}) }}
                    onClick={() => toggleDay(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                style={styles.textarea}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Brief notes about the class…"
                rows={3}
              />
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            <div style={styles.formFooter}>
              <button type="button" style={styles.cancelBtn} onClick={() => navigate('/classes')}>
                Cancel
              </button>
              <button type="submit" style={styles.submitBtn} disabled={loading}>
                {loading ? 'Creating…' : 'Create Class →'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,400&family=DM+Sans:wght@400;500&display=swap');
        input:focus, textarea:focus { border-color: #d97706 !important; box-shadow: 0 0 0 3px rgba(217,119,6,0.12) !important; }
      `}</style>
    </div>
  );
};

const Field = ({ label, value, onChange, placeholder }) => (
  <div style={styles.fieldGroup}>
    <label style={styles.label}>{label}</label>
    <input
      style={styles.input}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

const TOKEN = '#1a1209';
const CREAM = '#fdf8f0';
const AMBER = '#d97706';
const BORDER = '#e8e0d0';

const styles = {
  page: { minHeight: '100vh', background: CREAM, fontFamily: "'DM Sans', sans-serif", color: TOKEN, padding: '40px 24px' },
  container: { maxWidth: 960, margin: '0 auto' },
  backBtn: { background: 'none', border: 'none', color: '#8a7a65', fontSize: 14, cursor: 'pointer', marginBottom: 24, padding: 0, fontFamily: "'DM Sans', sans-serif" },
  card: { display: 'flex', background: '#fff', borderRadius: 18, border: `1.5px solid ${BORDER}`, overflow: 'hidden', boxShadow: '0 8px 32px rgba(26,18,9,0.06)' },
  leftPanel: { width: 280, flexShrink: 0, background: TOKEN, color: '#fff', padding: '48px 32px', display: 'flex', flexDirection: 'column' },
  eyebrow: { fontSize: 10, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: AMBER, marginBottom: 12 },
  title: { fontFamily: "'Fraunces', serif", fontSize: 44, fontWeight: 600, margin: '0 0 16px', lineHeight: 1.1 },
  subtitle: { fontSize: 13, lineHeight: 1.7, color: '#c4b89a', margin: 0 },
  decorLine: { width: 40, height: 2, background: AMBER, margin: '32px 0' },
  tip: { fontSize: 12, color: '#c4b89a', display: 'flex', gap: 8, lineHeight: 1.6 },
  tipIcon: { fontSize: 16, flexShrink: 0 },
  form: { flex: 1, padding: '40px 40px 32px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 0 },
  fieldGroup: { marginBottom: 20 },
  label: { display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a7a65', marginBottom: 6 },
  input: { width: '100%', padding: '11px 14px', border: `1.5px solid ${BORDER}`, borderRadius: 8, fontSize: 14, background: CREAM, color: TOKEN, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' },
  textarea: { width: '100%', padding: '11px 14px', border: `1.5px solid ${BORDER}`, borderRadius: 8, fontSize: 14, background: CREAM, color: TOKEN, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box', resize: 'vertical', transition: 'border-color 0.15s, box-shadow 0.15s' },
  dayRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  dayBtn: { padding: '7px 14px', border: `1.5px solid ${BORDER}`, borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: CREAM, color: '#8a7a65', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' },
  dayBtnActive: { background: TOKEN, color: '#fff', borderColor: TOKEN },
  errorBox: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 16 },
  formFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { background: 'none', border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: '10px 20px', fontSize: 14, color: '#8a7a65', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  submitBtn: { background: AMBER, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
};

export default CreateClass;