import React, { useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { api } from '../api';

const token = () => localStorage.getItem('token');
const user  = () => { try { return JSON.parse(localStorage.getItem('user')||'{}'); } catch { return {}; } };

const COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4'];

function CircleProgress({ pct, color, size = 80 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f0ebe0" strokeWidth={8} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }} />
    </svg>
  );
}

export default function StudentDashboard() {
  const [attendance, setAttendance] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const u = user();

  const fetch_ = async () => {
    try {
      setLoading(true); setError('');
      const res  = await api('/api/attendance/my');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setAttendance(data.attendance || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []); // eslint-disable-line

  const overall      = attendance.length ? Math.round(attendance.reduce((s,r) => s + parseFloat(r.percentage||0), 0) / attendance.length) : 0;
  const totalPresent = attendance.reduce((s,r) => s + parseInt(r.present||0), 0);
  const totalClasses = attendance.reduce((s,r) => s + parseInt(r.total_classes||0), 0);
  const atRisk       = attendance.filter(r => parseFloat(r.percentage||0) < 75).length;

  const overallColor = overall >= 75 ? '#10b981' : overall >= 60 ? '#f59e0b' : '#ef4444';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  if (loading) return (
    <div style={S.page}>
      <div style={S.shimmerWrap}>
        {[...Array(5)].map((_,i) => <div key={i} style={S.shimmer} />)}
      </div>
      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
    </div>
  );

  if (error) return (
    <div style={S.page}>
      <div style={S.errorBox}>{error}
        <button onClick={fetch_} style={S.retryBtn}>Retry</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        .card-hover:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,0.10)!important;}
        .card-hover{transition:transform 0.2s,box-shadow 0.2s;}
      `}</style>

      {/* ── TOP HERO ── */}
      <div style={S.hero}>
        <div style={S.heroLeft}>
          <div style={S.heroGreeting}>{greeting} 👋</div>
          <h1 style={S.heroName}>{u.name || 'Student'}</h1>
          <div style={S.heroBadge}>
            <span style={{ color: '#d97706' }}>●</span>&nbsp;
            {u.role} · Computer Science · Year 3
          </div>
        </div>
        <div style={S.heroRight}>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircleProgress pct={overall} color={overallColor} size={110} />
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: overallColor }}>{overall}%</div>
              <div style={{ fontSize: 10, color: '#8a7a65', letterSpacing: '0.05em' }}>OVERALL</div>
            </div>
          </div>
          <button onClick={fetch_} style={S.refreshBtn}><RefreshCcw size={14} /></button>
        </div>
      </div>

      {/* ── STAT PILLS ── */}
      <div style={S.pillRow}>
        <StatPill label="Classes Attended" value={totalPresent} icon="✅" color="#10b981" />
        <StatPill label="Total Classes"    value={totalClasses} icon="📚" color="#6366f1" />
        <StatPill label="Subjects"         value={attendance.length} icon="📖" color="#f59e0b" />
        <StatPill label="At Risk"          value={atRisk} icon="⚠️" color={atRisk > 0 ? '#ef4444' : '#10b981'} />
      </div>

      {/* ── WARNING BANNER ── */}
      {atRisk > 0 && (
        <div style={S.warnBanner}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Attendance Warning</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              {atRisk} subject{atRisk > 1 ? 's are' : ' is'} below 75%. You may be detained if not improved.
            </div>
          </div>
        </div>
      )}

      {/* ── COURSE CARDS ── */}
      <div style={S.sectionHead}>
        <div style={S.sectionTitle}>📋 Subject-wise Attendance</div>
        <div style={{ fontSize: 12, color: '#8a7a65' }}>{attendance.length} subjects enrolled</div>
      </div>

      {attendance.length === 0 ? (
        <div style={S.emptyBox}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
          <div style={{ color: '#8a7a65', fontSize: 15 }}>No attendance records yet.</div>
        </div>
      ) : (
        <div style={S.cardGrid}>
          {attendance.map((row, i) => {
            const pct   = parseFloat(row.percentage || 0);
            const color = pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
            const bg    = pct >= 75 ? '#ecfdf5' : pct >= 60 ? '#fffbeb' : '#fef2f2';
            const accent = COLORS[i % COLORS.length];
            const needed = pct < 75
              ? Math.ceil((0.75 * parseInt(row.total_classes) - parseInt(row.present)) / 0.25)
              : null;
            return (
              <div key={i} className="card-hover" style={{ ...S.courseCard, animationDelay: `${i * 60}ms` }}>
                <div style={{ ...S.courseAccent, background: accent }} />
                <div style={S.courseTop}>
                  <div style={{ ...S.courseIcon, background: accent + '18', color: accent }}>
                    {['🧠','⚙️','🖥️','☁️','🗄️','🌐','📐','🔧'][i % 8]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.courseName}>{row.subject_name}</div>
                    <div style={S.courseMeta}>
                      Last class: {row.last_class ? String(row.last_class).slice(0,10) : '—'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <CircleProgress pct={pct} color={color} size={64} />
                    <div style={{ marginTop: -46, fontSize: 13, fontWeight: 800, color, textAlign: 'center' }}>{pct}%</div>
                  </div>
                </div>

                <div style={S.courseStats}>
                  <div style={S.statBox}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>{row.present}</div>
                    <div style={{ fontSize: 11, color: '#8a7a65' }}>Present</div>
                  </div>
                  <div style={S.statBox}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>{parseInt(row.total_classes) - parseInt(row.present)}</div>
                    <div style={{ fontSize: 11, color: '#8a7a65' }}>Absent</div>
                  </div>
                  <div style={S.statBox}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#6366f1' }}>{row.total_classes}</div>
                    <div style={{ fontSize: 11, color: '#8a7a65' }}>Total</div>
                  </div>
                </div>

                <div style={S.barTrack}>
                  <div style={{ ...S.barFill, width: `${Math.min(pct,100)}%`, background: color }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <span style={{ ...S.statusChip, background: bg, color }}>
                    {pct >= 75 ? '✓ Good Standing' : pct >= 60 ? '⚡ Needs Improvement' : '✗ Critical'}
                  </span>
                  {needed && needed > 0 && (
                    <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>
                      Need {needed} more class{needed > 1 ? 'es' : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LEGEND ── */}
      <div style={S.legend}>
        <span><span style={{ color: '#10b981', fontWeight: 700 }}>●</span> ≥75% Safe</span>
        <span><span style={{ color: '#f59e0b', fontWeight: 700 }}>●</span> 60–74% Warning</span>
        <span><span style={{ color: '#ef4444', fontWeight: 700 }}>●</span> &lt;60% Critical</span>
      </div>
    </div>
  );
}

function StatPill({ label, value, icon, color }) {
  return (
    <div style={{ background: '#fff', border: '1.5px solid #e8e0d0', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: 11, color: '#8a7a65', marginTop: 1 }}>{label}</div>
      </div>
    </div>
  );
}

const S = {
  page:        { minHeight: '100vh', background: 'linear-gradient(135deg,#fdf8f0 0%,#f4f1ea 100%)', padding: '28px 28px 48px', fontFamily: "'DM Sans',sans-serif" },
  hero:        { background: 'linear-gradient(135deg,#1a1209 0%,#2d1f0e 100%)', borderRadius: 20, padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, boxShadow: '0 8px 32px rgba(26,18,9,0.18)' },
  heroLeft:    { flex: 1 },
  heroGreeting:{ fontSize: 13, color: '#d97706', letterSpacing: '0.08em', marginBottom: 6 },
  heroName:    { margin: '0 0 8px', fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' },
  heroBadge:   { fontSize: 12, color: '#c4b89a', display: 'flex', alignItems: 'center', gap: 4 },
  heroRight:   { display: 'flex', alignItems: 'center', gap: 16 },
  refreshBtn:  { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  pillRow:     { display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' },
  warnBanner:  { background: 'linear-gradient(135deg,#fef3c7,#fde68a)', border: '1.5px solid #fcd34d', borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', gap: 14, alignItems: 'flex-start', color: '#92400e' },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle:{ fontSize: 16, fontWeight: 700, color: '#1a1209' },
  cardGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 },
  courseCard:  { background: '#fff', borderRadius: 16, padding: '20px 20px 16px', border: '1.5px solid #e8e0d0', position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.4s ease forwards', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  courseAccent:{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderRadius: '16px 16px 0 0' },
  courseTop:   { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  courseIcon:  { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 },
  courseName:  { fontWeight: 700, fontSize: 14, color: '#1a1209', lineHeight: 1.3, marginBottom: 3 },
  courseMeta:  { fontSize: 11, color: '#8a7a65' },
  courseStats: { display: 'flex', gap: 8, marginBottom: 12 },
  statBox:     { flex: 1, background: '#faf7f2', borderRadius: 8, padding: '8px 0', textAlign: 'center' },
  barTrack:    { height: 6, background: '#f0ebe0', borderRadius: 4, overflow: 'hidden' },
  barFill:     { height: '100%', borderRadius: 4, transition: 'width 0.8s ease' },
  statusChip:  { fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 },
  emptyBox:    { background: '#fff', borderRadius: 16, border: '1.5px solid #e8e0d0', padding: 60, textAlign: 'center' },
  errorBox:    { background: '#fef2f2', color: '#dc2626', padding: 16, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 },
  retryBtn:    { padding: '6px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  legend:      { display: 'flex', gap: 20, marginTop: 24, fontSize: 12, color: '#8a7a65' },
  shimmerWrap: { display: 'flex', flexDirection: 'column', gap: 16, padding: 28 },
  shimmer:     { height: 80, borderRadius: 12, background: 'linear-gradient(90deg,#f0ebe0 25%,#faf7f2 50%,#f0ebe0 75%)', backgroundSize: '400px 100%', animation: 'shimmer 1.4s infinite' },
};
