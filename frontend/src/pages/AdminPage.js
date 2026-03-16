import React, { useEffect, useState } from 'react';
import { api } from '../api';

const ROLES = ['ADMIN', 'FACULTY', 'STUDENT'];
const jsonHdr = () => ({ 'Content-Type': 'application/json' });

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT', department: '', roll_number: '', year: 1, section: 'A' });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch { setError('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openAdd = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'STUDENT', department: '', roll_number: '', year: 1, section: 'A' });
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, department: '', roll_number: '', year: 1, section: 'A' });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editUser) {
        await api(`/api/users/${editUser.user_id}`, {
          method: 'PUT', headers: jsonHdr(),
          body: JSON.stringify({ name: form.name, email: form.email, role: form.role })
        });
      } else {
        const res = await api('/api/users', {
          method: 'POST', headers: jsonHdr(), body: JSON.stringify(form)
        });
        const data = await res.json();
        if (!res.ok) { alert(data.error); setSaving(false); return; }
      }
      setShowForm(false);
      fetchUsers();
    } catch { alert('Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    await api(`/api/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  };

  const roleBadge = (role) => {
    const colors = { ADMIN: '#7c3aed', FACULTY: '#0369a1', STUDENT: '#15803d' };
    return <span style={{ background: colors[role] + '20', color: colors[role], padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{role}</span>;
  };

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: '#d97706', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Admin Panel</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>User Management</h1>
        </div>
        <button onClick={openAdd} style={btnStyle('#1a1209')}>+ Add User</button>
      </div>

      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {loading ? <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Loading...</div> : (
        <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #e8e0d0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#faf7f2' }}>
                {['Name', 'Email', 'Role', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#8a7a65', letterSpacing: '0.06em', borderBottom: '1.5px solid #e8e0d0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.user_id} style={{ borderBottom: '1px solid #f0ebe0' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: '14px 16px', color: '#555' }}>{u.email}</td>
                  <td style={{ padding: '14px 16px' }}>{roleBadge(u.role)}</td>
                  <td style={{ padding: '14px 16px', color: '#888', fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(u)} style={btnStyle('#0369a1', true)}>Edit</button>
                      <button onClick={() => handleDelete(u.user_id)} style={btnStyle('#dc2626', true)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 440, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 20 }}>{editUser ? 'Edit User' : 'Add User'}</h2>
            {[
              { label: 'Full Name', key: 'name', type: 'text' },
              { label: 'Email', key: 'email', type: 'email' },
              ...(!editUser ? [{ label: 'Password', key: 'password', type: 'password' }] : []),
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={labelStyle}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inputStyle} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Role</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} style={inputStyle}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            {!editUser && form.role === 'STUDENT' && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Roll Number</label>
                  <input value={form.roll_number} onChange={e => setForm(p => ({ ...p, roll_number: e.target.value }))} style={inputStyle} placeholder="e.g. 22CS007" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>Year</label>
                    <input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} style={inputStyle} min={1} max={4} />
                  </div>
                  <div>
                    <label style={labelStyle}>Section</label>
                    <input value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))} style={inputStyle} placeholder="A" />
                  </div>
                </div>
              </>
            )}
            {!editUser && (form.role === 'FACULTY' || form.role === 'STUDENT') && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Department</label>
                <input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} style={inputStyle} placeholder="e.g. Computer Science" />
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={btnStyle('#888', true)}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={btnStyle('#1a1209')}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle = (bg, small) => ({
  background: bg, color: '#fff', border: 'none', borderRadius: 8,
  padding: small ? '6px 14px' : '10px 20px', fontSize: small ? 13 : 14,
  fontWeight: 500, cursor: 'pointer',
});
const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#8a7a65', marginBottom: 5, letterSpacing: '0.06em' };
const inputStyle = { width: '100%', padding: '10px 12px', border: '1.5px solid #e8e0d0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' };
