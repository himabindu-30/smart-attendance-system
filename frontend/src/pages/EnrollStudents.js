import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EnrollStudents = () => {
  const { id: classId } = useParams();
  const navigate = useNavigate();

  const [classInfo, setClassInfo] = useState(null);
  const [available, setAvailable] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null); // enrollment id
  const [toast, setToast] = useState('');

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchData = useCallback(async () => {
    try {
      const [clsRes, availRes, enrollRes] = await Promise.all([
        fetch(`/api/classes/${classId}`),
        fetch(`/api/classes/${classId}/available-students`),
        fetch(`/api/classes/${classId}/enrolled-students`),
      ]);
      setClassInfo(await clsRes.json());
      setAvailable(await availRes.json());
      setEnrolled(await enrollRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [classId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredAvailable = available.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = id => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    const visibleIds = filteredAvailable.map(s => s.id);
    const allSelected = visibleIds.every(id => selected.includes(id));
    setSelected(allSelected ? selected.filter(id => !visibleIds.includes(id)) : [...new Set([...selected, ...visibleIds])]);
  };

  const handleEnroll = async () => {
    if (!selected.length) return;
    setEnrolling(true);
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: classId, student_ids: selected }),
      });
      if (!res.ok) throw new Error();
      setSelected([]);
      await fetchData();
      showToast(`✓ ${selected.length} student${selected.length > 1 ? 's' : ''} enrolled`);
    } catch { showToast('Failed to enroll students'); }
    setEnrolling(false);
  };

  const handleRemove = async enrollmentId => {
    try {
      await fetch(`/api/enrollments/${enrollmentId}`, { method: 'DELETE' });
      await fetchData();
      showToast('Student removed from class');
    } catch { showToast('Failed to remove student'); }
    setConfirmRemove(null);
  };

  const visibleIds = filteredAvailable.map(s => s.id);
  const allVisible = visibleIds.length > 0 && visibleIds.every(id => selected.includes(id));

  if (loading) return (
    <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={styles.spinner} />
    </div>
  );

  return (
    <div style={styles.page}>
      {/* Toast */}
      {toast && <div style={styles.toast}>{toast}</div>}

      {/* Confirm Dialog */}
      {confirmRemove && (
        <div style={styles.overlay}>
          <div style={styles.dialog}>
            <div style={styles.dialogIcon}>⚠️</div>
            <h3 style={styles.dialogTitle}>Remove Student?</h3>
            <p style={styles.dialogText}>This will unenroll the student from the class. Their attendance records will be preserved.</p>
            <div style={styles.dialogBtns}>
              <button style={styles.cancelBtn} onClick={() => setConfirmRemove(null)}>Cancel</button>
              <button style={styles.dangerBtn} onClick={() => handleRemove(confirmRemove)}>Remove</button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.topBar}>
          <button style={styles.backBtn} onClick={() => navigate('/classes')}>← Classes</button>
          {classInfo && (
            <div style={styles.classChip}>
              <span style={styles.classSubject}>{classInfo.subject}</span>
              <span style={styles.sep}>·</span>
              <span>{classInfo.faculty}</span>
              <span style={styles.sep}>·</span>
              <span style={styles.sectionTag}>{classInfo.section}</span>
            </div>
          )}
        </div>

        <div style={styles.pageTitle}>
          <div style={styles.eyebrow}>Enrollment Manager</div>
          <h1 style={styles.title}>Student Enrollment</h1>
        </div>

        {/* Main grid */}
        <div style={styles.grid}>
          {/* LEFT: Available */}
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <div style={styles.panelLabel}>Available Students</div>
                <div style={styles.panelCount}>{available.length} not yet enrolled</div>
              </div>
              {selected.length > 0 && (
                <button
                  style={{ ...styles.enrollBtn, ...(enrolling ? styles.disabledBtn : {}) }}
                  onClick={handleEnroll}
                  disabled={enrolling}
                >
                  {enrolling ? 'Enrolling…' : `Enroll ${selected.length} →`}
                </button>
              )}
            </div>

            <div style={styles.searchWrap}>
              <span style={styles.searchIcon}>⌕</span>
              <input
                style={styles.searchInput}
                placeholder="Search name or roll number…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {filteredAvailable.length > 0 && (
              <label style={styles.selectAllRow}>
                <input type="checkbox" checked={allVisible} onChange={toggleAll} style={{ accentColor: '#d97706' }} />
                <span style={styles.selectAllLabel}>Select all ({filteredAvailable.length})</span>
              </label>
            )}

            <div style={styles.studentList}>
              {filteredAvailable.length === 0 ? (
                <div style={styles.emptyState}>
                  {search ? 'No students match your search.' : 'All students are enrolled!'}
                </div>
              ) : filteredAvailable.map(s => (
                <label key={s.id} style={{ ...styles.availableRow, ...(selected.includes(s.id) ? styles.selectedRow : {}) }}>
                  <input
                    type="checkbox"
                    checked={selected.includes(s.id)}
                    onChange={() => toggleSelect(s.id)}
                    style={{ accentColor: '#d97706', flexShrink: 0 }}
                  />
                  <div style={styles.avatar}>{s.name?.[0]?.toUpperCase() || '?'}</div>
                  <div style={styles.studentInfo}>
                    <div style={styles.studentName}>{s.name}</div>
                    <div style={styles.rollNum}>{s.roll_number}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* RIGHT: Enrolled */}
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <div style={styles.panelLabel}>Enrolled Students</div>
                <div style={styles.panelCount}>{enrolled.length} currently enrolled</div>
              </div>
              <div style={styles.enrolledBadge}>{enrolled.length}</div>
            </div>

            <div style={styles.studentList}>
              {enrolled.length === 0 ? (
                <div style={styles.emptyState}>No students enrolled yet. Select students on the left to begin.</div>
              ) : enrolled.map(s => (
                <div key={s.enrollment_id} style={styles.enrolledRow}>
                  <div style={styles.enrolledLeft}>
                    {s.photo ? (
                      <img src={s.photo} alt={s.name} style={styles.photo} />
                    ) : (
                      <div style={{ ...styles.avatar, ...styles.avatarLarge }}>{s.name?.[0]?.toUpperCase() || '?'}</div>
                    )}
                    <div style={styles.studentInfo}>
                      <div style={styles.studentName}>{s.name}</div>
                      <div style={styles.rollNum}>{s.roll_number}</div>
                    </div>
                  </div>
                  <button
                    style={styles.removeBtn}
                    onClick={() => setConfirmRemove(s.enrollment_id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,400&family=DM+Sans:wght@400;500&display=swap');
        @keyframes slideIn { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const TOKEN = '#1a1209';
const CREAM = '#fdf8f0';
const AMBER = '#d97706';
const BORDER = '#e8e0d0';

const styles = {
  page: { minHeight: '100vh', background: CREAM, fontFamily: "'DM Sans', sans-serif", color: TOKEN, padding: '32px 24px' },
  container: { maxWidth: 1200, margin: '0 auto' },
  spinner: { width: 40, height: 40, border: `3px solid ${BORDER}`, borderTopColor: AMBER, borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  toast: { position: 'fixed', top: 24, right: 24, background: TOKEN, color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500, zIndex: 1000, animation: 'slideIn 0.3s ease', fontFamily: "'DM Sans', sans-serif" },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(26,18,9,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dialog: { background: '#fff', borderRadius: 16, padding: 32, width: 360, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  dialogIcon: { fontSize: 36, marginBottom: 12 },
  dialogTitle: { fontFamily: "'Fraunces', serif", fontSize: 22, margin: '0 0 8px' },
  dialogText: { fontSize: 13, color: '#8a7a65', lineHeight: 1.6, margin: '0 0 24px' },
  dialogBtns: { display: 'flex', gap: 12, justifyContent: 'center' },
  topBar: { display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 },
  backBtn: { background: 'none', border: 'none', color: '#8a7a65', fontSize: 14, cursor: 'pointer', padding: 0, fontFamily: "'DM Sans', sans-serif", flexShrink: 0 },
  classChip: { display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `1.5px solid ${BORDER}`, borderRadius: 30, padding: '6px 18px', fontSize: 13 },
  classSubject: { fontFamily: "'Fraunces', serif", fontWeight: 600 },
  sep: { color: BORDER },
  sectionTag: { background: '#fef3c7', color: '#92400e', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 },
  pageTitle: { marginBottom: 24 },
  eyebrow: { fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: AMBER, marginBottom: 4 },
  title: { fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 600, margin: 0, lineHeight: 1 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  panel: { background: '#fff', borderRadius: 16, border: `1.5px solid ${BORDER}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 0' },
  panelLabel: { fontSize: 12, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a7a65' },
  panelCount: { fontSize: 13, color: TOKEN, marginTop: 2 },
  enrolledBadge: { background: '#f0fdf4', color: '#166534', padding: '4px 14px', borderRadius: 20, fontSize: 14, fontWeight: 600 },
  enrollBtn: { background: AMBER, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  disabledBtn: { opacity: 0.6, cursor: 'not-allowed' },
  searchWrap: { position: 'relative', padding: '16px 20px 0' },
  searchIcon: { position: 'absolute', left: 34, top: '50%', transform: 'translateY(-20%)', fontSize: 18, color: '#b0a090', pointerEvents: 'none' },
  searchInput: { width: '100%', padding: '9px 14px 9px 38px', border: `1.5px solid ${BORDER}`, borderRadius: 8, fontSize: 13, background: CREAM, color: TOKEN, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' },
  selectAllRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px 4px', cursor: 'pointer' },
  selectAllLabel: { fontSize: 12, color: '#8a7a65' },
  studentList: { flex: 1, overflowY: 'auto', padding: '8px 12px 16px', maxHeight: 520 },
  emptyState: { padding: 32, textAlign: 'center', fontSize: 13, color: '#b0a090', lineHeight: 1.6 },
  availableRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', transition: 'background 0.1s', marginBottom: 2 },
  selectedRow: { background: '#fef3c7' },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: `${AMBER}22`, color: AMBER, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, flexShrink: 0 },
  avatarLarge: { width: 40, height: 40, fontSize: 16 },
  photo: { width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: 500 },
  rollNum: { fontSize: 12, color: '#8a7a65', marginTop: 1 },
  enrolledRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, marginBottom: 2, transition: 'background 0.1s' },
  enrolledLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  removeBtn: { background: 'none', border: `1px solid #fecaca`, color: '#dc2626', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'background 0.1s' },
  cancelBtn: { background: 'none', border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: '10px 20px', fontSize: 14, color: '#8a7a65', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  dangerBtn: { background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
};

export default EnrollStudents;