import React, { useState } from 'react';
import { api } from '../api';
import './Login.css';

const ROLES = [
  { label: 'Admin',   email: 'admin@test.com',  icon: '⚙️' },
  { label: 'Faculty', email: 'ravi@college.com', icon: '👨🏫' },
  { label: 'Student', email: 'hima@college.com', icon: '🎓' },
];

export default function Login() {
  const [activeTab, setActiveTab] = useState(0);
  const [email,    setEmail]    = useState('admin@test.com');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const switchTab = (idx) => {
    setActiveTab(idx);
    setEmail(ROLES[idx].email);
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const res = await api('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw { response: { data } };
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="login-header-top">Smart Attendance ERP</div>
          <h1>Welcome Back</h1>
          <h2>Sign in to your account</h2>
        </div>

        <div className="login-body">
          <div className="role-tabs">
            {ROLES.map((r, i) => (
              <button
                key={r.label}
                type="button"
                className={`role-tab${activeTab === i ? ' active' : ''}`}
                onClick={() => switchTab(i)}
              >
                {r.icon} {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? 'Signing in…' : `Sign In as ${ROLES[activeTab].label}`}
            </button>
          </form>

          <div className="login-footer">
            Default password: <strong>password123</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
