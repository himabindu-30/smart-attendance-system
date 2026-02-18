import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ClassList = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => { setClasses(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = classes.filter(c =>
    c.subject?.toLowerCase().includes(search.toLowerCase()) ||
    c.faculty?.toLowerCase().includes(search.toLowerCase()) ||
    c.section?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>Academic Management</div>
            <h1 style={styles.title}>Classes</h1>
          </div>
          <button style={styles.primaryBtn} onClick={() => navigate('/classes/new')}>
            <span style={styles.plusIcon}>+</span> New Class
          </button>
        </div>

        {/* Search */}
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>⌕</span>
          <input
            style={styles.searchInput}
            placeholder="Search by subject, faculty, or section…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div style={styles.center}>
            <div style={styles.spinner} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>📚</div>
            <p style={styles.emptyText}>No classes found</p>
            <button style={styles.primaryBtn} onClick={() => navigate('/classes/new')}>Create your first class</button>
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Subject', 'Faculty', 'Section', 'Schedule', 'Students', 'Actions'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((cls, i) => (
                  <tr key={cls.id} style={{ ...styles.tr, animationDelay: `${i * 40}ms` }}>
                    <td style={styles.td}>
                      <span style={styles.subjectBadge}>{cls.subject}</span>
                    </td>
                    <td style={styles.td}>{cls.faculty}</td>
                    <td style={styles.td}>
                      <span style={styles.sectionTag}>{cls.section}</span>
                    </td>
                    <td style={styles.td}>{cls.schedule || '—'}</td>
                    <td style={styles.td}>
                      <span style={styles.count}>{cls.student_count ?? 0}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button
                          style={styles.actionBtn}
                          onClick={() => navigate(`/classes/${cls.id}/enroll`)}
                        >
                          Enroll
                        </button>
                        <button
                          style={{ ...styles.actionBtn, ...styles.ghostBtn }}
                          onClick={() => navigate(`/classes/${cls.id}`)}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={styles.footer}>
          {filtered.length} class{filtered.length !== 1 ? 'es' : ''} total
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .row-anim { animation: fadeUp 0.3s ease forwards; }
        tr:hover td { background: #faf7f2 !important; }
      `}</style>
    </div>
  );
};

const TOKEN = '#1a1209';
const CREAM = '#fdf8f0';
const AMBER = '#d97706';
const BORDER = '#e8e0d0';

const styles = {
  page: { minHeight: '100vh', background: CREAM, fontFamily: "'DM Sans', sans-serif", color: TOKEN, padding: '40px 24px' },
  container: { maxWidth: 1100, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 },
  eyebrow: { fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: AMBER, marginBottom: 4 },
  title: { fontFamily: "'Fraunces', serif", fontSize: 42, fontWeight: 600, margin: 0, lineHeight: 1 },
  primaryBtn: { background: TOKEN, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif" },
  plusIcon: { fontSize: 18, lineHeight: 1 },
  searchWrap: { position: 'relative', marginBottom: 24 },
  searchIcon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 20, color: '#999', pointerEvents: 'none' },
  searchInput: { width: '100%', padding: '12px 16px 12px 44px', border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 14, background: '#fff', color: TOKEN, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' },
  tableWrap: { background: '#fff', borderRadius: 14, border: `1.5px solid ${BORDER}`, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '14px 20px', textAlign: 'left', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a7a65', borderBottom: `1.5px solid ${BORDER}`, background: '#faf7f2' },
  tr: { animation: 'fadeUp 0.3s ease forwards' },
  td: { padding: '16px 20px', fontSize: 14, borderBottom: `1px solid ${BORDER}`, transition: 'background 0.15s' },
  subjectBadge: { fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 600 },
  sectionTag: { background: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 },
  count: { background: '#f0fdf4', color: '#166534', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 },
  actions: { display: 'flex', gap: 8 },
  actionBtn: { background: AMBER, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  ghostBtn: { background: 'transparent', color: TOKEN, border: `1.5px solid ${BORDER}` },
  center: { display: 'flex', justifyContent: 'center', padding: 80 },
  spinner: { width: 36, height: 36, border: `3px solid ${BORDER}`, borderTopColor: AMBER, borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  empty: { textAlign: 'center', padding: '80px 0' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#8a7a65', marginBottom: 20, fontSize: 15 },
  footer: { marginTop: 16, fontSize: 12, color: '#b0a090', textAlign: 'right' },
};

export default ClassList;