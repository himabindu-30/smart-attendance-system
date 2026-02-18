// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ClassList from './pages/ClassList';
import CreateClass from './pages/CreateClass';
import EnrollStudents from './pages/EnrollStudents';
import './App.css';

// Temporary placeholder components (we'll build these later)
function Dashboard() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p>Welcome to Smart Attendance System</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

function Profile() {
  return (
    <div className="profile">
      <h1>Profile</h1>
      <p>Your profile information</p>
    </div>
  );
}

// PrivateRoute wrapper - checks if user is logged in
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes - need login */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        {/* Class Management routes */}
        <Route
          path="/classes"
          element={
            <PrivateRoute>
              <ClassList />
            </PrivateRoute>
          }
        />

        <Route
          path="/classes/new"
          element={
            <PrivateRoute>
              <CreateClass />
            </PrivateRoute>
          }
        />

        {/* Student Enrollment route */}
        <Route
          path="/classes/:id/enroll"
          element={
            <PrivateRoute>
              <EnrollStudents />
            </PrivateRoute>
          }
        />

        {/* Default route - redirect to login */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;