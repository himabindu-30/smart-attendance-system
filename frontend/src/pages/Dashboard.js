import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, LineElement, BarElement,
  CategoryScale, LinearScale, PointElement, Tooltip, Legend,
} from 'chart.js';
import { RefreshCcw } from 'lucide-react';
import { api } from '../api';

ChartJS.register(LineElement, BarElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const C = { dark: '#1a1209', amber: '#d97706', border: '#e8e0d0', cream: '#fdf8f0' };

export default function Dashboard() {
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [stats, setStats]                 = useState({});
  const [monthlyTrend, setMonthlyTrend]   = useState([]);
  const [subjectWise, setSubjectWise]     = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);

  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();

  const fetchDashboard = async () => {
    try {
      setLoading(true); setError('');
      const [trendRes, subjectRes, recentRes, statsRes] = await Promise.all([
        api('/api/dashboard/monthly-trend'),
        api('/api/dashboard/subject-wise'),
        api('/api/dashboard/recent-sessions'),
        api('/api/dashboard/stats'),
      ]);

      if (!trendRes.ok || !subjectRes.ok || !recentRes.ok || !statsRes.ok)
        throw new Error('Failed to load dashboard data');

      const [trend, subject, recent, statsData] = await Promise.all([
        trendRes.json(), subjectRes.json(), recentRes.json(), statsRes.json(),
      ]);

      setMonthlyTrend(trend.map(m => ({ month: m.month, percentage: parseFloat(m.percentage) })));
      setSubjectWise(subject.map(s => ({ subject: s.subject, percentage: parseFloat(s.percentage) })));
      setRecentSessions(recent.map(s => ({
        date: String(s.date).slice(0, 10),
        className: s.class_name,
        faculty: s.faculty_name,
        present: s.present_count,
        absent: s.absent_count,
        percentage: parseFloat(s.percentage),
      })));
      setStats({
        totalStudents: statsData.total_students,
        totalClasses:  statsData.total_classes,
        todaySessions: statsData.todays_sessions,
        avgAttendance: statsData.average_attendance,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.role === 'STUDENT') { window.location.replace('/my-attendance'); return; }
    fetchDashboard();
  }, []); // eslint-disable-line

  const lineData = {
    labels: monthlyTrend.map(m => m.month),
    datasets: [{ label: 'Attendance %', data: monthlyTrend.map(m => m.percentage), borderColor: '#d97706', backgroundColor: '#fef3c7', tension: 0.4 }],
  };
  const barData = {
    labels: subjectWise.map(s => s.subject),
    datasets: [{ label: 'Attendance %', data: subjectWise.map(s => s.percentage), backgroundColor: '#d97706' }],
  };

  const avgColor = stats.avgAttendance >= 80 ? '#16a34a' : stats.avgAttendance >= 70 ? '#d97706' : '#dc2626';

  if (loading) return (
    <div style={S.page}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={S.shimmer} />
      ))}
    </div>
  );

  if (error) return (
    <div style={S.page}>
      <div style={S.errorBox}>
        {error}
        <button onClick={fetchDashboard} style={S.retryBtn}>Retry</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.eyebrow}>Analytics</div>
          <h1 style={S.title}>Dashboard</h1>
        </div>
        <button onClick={fetchDashboard} style={S.refreshBtn}>
          <RefreshCcw size={15} style={{ marginRight: 6 }} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div style={S.statGrid}>
        <StatCard label="Total Students"    value={stats.totalStudents} icon="👥" color="#6366f1" />
        <StatCard label="Total Classes"     value={stats.totalClasses}  icon="📚" color="#d97706" />
        <StatCard label="Today's Sessions"  value={stats.todaySessions} icon="📅" color="#10b981" />
        <StatCard label="Avg Attendance"    value={`${stats.avgAttendance}%`} icon="📊" color={avgColor} />
      </div>

      {/* Charts */}
      <div style={S.chartRow}>
        <div style={S.chartCard}>
          <div style={S.chartTitle}>Monthly Attendance Trend</div>
          <Line data={lineData} options={{ plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }} />
        </div>
        <div style={S.chartCard}>
          <div style={S.chartTitle}>Subject-wise Attendance</div>
          <Bar data={barData} options={{ plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }} />
        </div>
      </div>

      {/* Recent sessions table */}
      <div style={S.tableCard}>
        <div style={S.chartTitle}>Recent Sessions</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr style={{ background: '#faf7f2' }}>
                {['Date', 'Class', 'Faculty', 'Present', 'Absent', '%'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentSessions.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#8a7a65' }}>No sessions yet</td></tr>
              )}
              {recentSessions.slice(0, 10).map((s, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={S.td}>{s.date}</td>
                  <td style={S.td}>{s.className}</td>
                  <td style={S.td}>{s.faculty}</td>
                  <td style={{ ...S.td, textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>{s.present}</td>
                  <td style={{ ...S.td, textAlign: 'center', color: '#dc2626', fontWeight: 600 }}>{s.absent}</td>
                  <td style={{ ...S.td, textAlign: 'center', fontWeight: 700, color: s.percentage >= 75 ? '#16a34a' : '#dc2626' }}>{s.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={S.statCard}>
      <div style={{ ...S.statIcon, background: color + '18', color }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, color: '#8a7a65', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.dark }}>{value ?? '—'}</div>
      </div>
    </div>
  );
}

const S = {
  page:       { minHeight: '100vh', background: C.cream, padding: '32px 28px', fontFamily: "'DM Sans', sans-serif" },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 },
  eyebrow:    { fontSize: 11, color: C.amber, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 },
  title:      { margin: 0, fontSize: 32, fontWeight: 800, color: C.dark },
  refreshBtn: { display: 'flex', alignItems: 'center', background: C.dark, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  statGrid:   { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  statCard:   { background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 },
  statIcon:   { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
  chartRow:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 },
  chartCard:  { background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '20px 24px' },
  chartTitle: { fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 16 },
  tableCard:  { background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '20px 24px' },
  table:      { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th:         { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#8a7a65', borderBottom: `1.5px solid ${C.border}`, letterSpacing: '0.06em' },
  td:         { padding: '12px 14px' },
  errorBox:   { background: '#fef2f2', color: '#dc2626', padding: 16, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 },
  retryBtn:   { padding: '6px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  shimmer:    { height: 80, borderRadius: 12, background: '#f0ebe0', marginBottom: 16 },
};
