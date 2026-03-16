import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import Login            from './pages/Login';
import Dashboard        from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import ClassList        from './pages/ClassList';
import CreateClass      from './pages/CreateClass';
import EnrollStudents   from './pages/EnrollStudents';
import Reports          from './pages/Reports';
import AdminPage        from './pages/AdminPage';
import TakeAttendance   from './pages/TakeAttendance';
import ManualAttendance from './pages/ManualAttendance';
import LiveAttendance   from './pages/LiveAttendance';
import FaceRegister     from './pages/FaceRegister';
import './App.css';

const getUser = () => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } };

function PrivateRoute({ children, allowRoles }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  const user = getUser();
  if (allowRoles && !allowRoles.includes(user.role)) return <Navigate to="/dashboard" />;
  return <Layout>{children}</Layout>;
}

const ROLE_CONFIG = {
  ADMIN:   { color: '#f59e0b', bg: '#fef3c7', label: 'Administrator', icon: '⚙️' },
  FACULTY: { color: '#6366f1', bg: '#eef2ff', label: 'Faculty',       icon: '👨‍🏫' },
  STUDENT: { color: '#10b981', bg: '#ecfdf5', label: 'Student',       icon: '🎓' },
};

function Layout({ children }) {
  const navigate = useNavigate();
  const user = getUser();
  const rc = ROLE_CONFIG[user.role] || ROLE_CONFIG.STUDENT;

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navGroups = user.role === 'STUDENT'
    ? [{ items: [
        { to: '/dashboard',     icon: '◈', label: 'Dashboard' },
        { to: '/my-attendance', icon: '✦', label: 'My Attendance' },
      ]}]
    : user.role === 'FACULTY'
    ? [{ label: 'MAIN', items: [
        { to: '/dashboard', icon: '◈', label: 'Dashboard' },
        { to: '/classes',   icon: '▦', label: 'Classes' },
        { to: '/reports',   icon: '◉', label: 'Reports' },
      ]}]
    : [
        { label: 'MAIN', items: [
          { to: '/dashboard', icon: '◈', label: 'Dashboard' },
          { to: '/classes',   icon: '▦', label: 'Classes' },
          { to: '/reports',   icon: '◉', label: 'Reports' },
        ]},
        { label: 'ADMIN', items: [
          { to: '/admin',         icon: '⊞', label: 'User Management' },
          { to: '/face-register', icon: '◎', label: 'Face Register' },
        ]},
      ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fdf8f0' }}>
      <aside style={sidebar}>
        {/* Logo */}
        <div style={sLogo}>
          <div style={sLogoIcon}>SA</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>SmartAttend</div>
            <div style={{ fontSize: 10, color: '#6b5a3e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>ERP System</div>
          </div>
        </div>

        {/* User card */}
        <div style={sUserCard}>
          <div style={{ ...sAvatar, background: rc.color }}>
            {user.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e8dcc8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ fontSize: 10, color: rc.color, marginTop: 2, fontWeight: 600, letterSpacing: '0.06em' }}>{rc.label.toUpperCase()}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
          {navGroups.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 8 }}>
              {group.label && <div style={sNavLabel}>{group.label}</div>}
              {group.items.map(item => (
                <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
                  ...sNavItem,
                  background: isActive ? rc.color : 'transparent',
                  color: isActive ? '#fff' : '#9a8a72',
                })}>
                  <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px', borderTop: '1px solid #1e1408' }}>
          <button onClick={logout} style={sLogout}>
            <span>⎋</span> Logout
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>{children}</main>
    </div>
  );
}

const sidebar  = { width: 230, background: '#0f0a05', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', boxShadow: '2px 0 20px rgba(0,0,0,0.15)' };
const sLogo    = { padding: '20px 16px 16px', borderBottom: '1px solid #1e1408', display: 'flex', alignItems: 'center', gap: 10 };
const sLogoIcon= { width: 34, height: 34, background: '#d97706', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 };
const sUserCard= { margin: '12px', background: '#1a1209', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 };
const sAvatar  = { width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 };
const sNavLabel= { fontSize: 9, fontWeight: 700, color: '#3d2e1a', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 8px 4px' };
const sNavItem = { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, marginBottom: 2, textDecoration: 'none', fontSize: 13, fontWeight: 500, transition: 'all 0.15s' };
const sLogout  = { width: '100%', padding: '9px 12px', background: 'transparent', border: '1px solid #1e1408', borderRadius: 8, color: '#6b5a3e', cursor: 'pointer', fontSize: 13, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 };

const FA = ['FACULTY', 'ADMIN'];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard"    element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/my-attendance" element={<PrivateRoute allowRoles={['STUDENT']}><StudentDashboard /></PrivateRoute>} />
        <Route path="/classes"                       element={<PrivateRoute allowRoles={FA}><ClassList /></PrivateRoute>} />
        <Route path="/classes/new"                   element={<PrivateRoute allowRoles={FA}><CreateClass /></PrivateRoute>} />
        <Route path="/classes/:id/enroll"            element={<PrivateRoute allowRoles={FA}><EnrollStudents /></PrivateRoute>} />
        <Route path="/classes/:id"                   element={<PrivateRoute allowRoles={FA}><EnrollStudents /></PrivateRoute>} />
        <Route path="/classes/:id/attendance"        element={<PrivateRoute allowRoles={FA}><TakeAttendance /></PrivateRoute>} />
        <Route path="/classes/:id/attendance/manual" element={<PrivateRoute allowRoles={FA}><ManualAttendance /></PrivateRoute>} />
        <Route path="/classes/:id/attendance/live"   element={<PrivateRoute allowRoles={FA}><LiveAttendance /></PrivateRoute>} />
        <Route path="/reports"       element={<PrivateRoute allowRoles={FA}><Reports /></PrivateRoute>} />
        <Route path="/admin"         element={<PrivateRoute allowRoles={['ADMIN']}><AdminPage /></PrivateRoute>} />
        <Route path="/face-register" element={<PrivateRoute allowRoles={['ADMIN']}><FaceRegister /></PrivateRoute>} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
