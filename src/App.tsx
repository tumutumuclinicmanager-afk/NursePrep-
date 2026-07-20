/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import Home from './pages/Home';
import StudentDashboard from './pages/StudentDashboard';
import ExamBank from './pages/ExamBank';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminOverview from './pages/admin/AdminOverview';
import UserManagement from './pages/admin/UserManagement';
import Payments from './pages/admin/Payments';
import Analytics from './pages/admin/Analytics';
import UploadExams from './pages/staff/UploadExams';
import LiveSessions from './pages/staff/LiveSessions';
import StudentQueries from './pages/staff/StudentQueries';

import Pricing from './pages/Pricing';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-12 text-center text-xl text-slate-500 font-serif border-2 border-dashed border-slate-200 rounded-2xl m-4">
      {title} coming soon...
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const userRole = localStorage.getItem('userRole');
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<PlaceholderPage title="Courses" />} />
          <Route path="/exams" element={<ProtectedRoute><ExamBank /></ProtectedRoute>} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<PlaceholderPage title="About Us" />} />
          <Route path="/contact" element={<PlaceholderPage title="Contact" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        
        <Route path="/dashboard" element={<DashboardLayout userRole="student" />}>
          <Route index element={<StudentDashboard />} />
          <Route path="courses" element={<PlaceholderPage title="My Courses" />} />
          <Route path="performance" element={<PlaceholderPage title="Performance Metrics" />} />
          <Route path="*" element={<PlaceholderPage title="Work in progress" />} />
        </Route>

        <Route path="/staff" element={<DashboardLayout userRole="staff" />}>
          <Route index element={<Navigate to="/staff/upload" replace />} />
          <Route path="upload" element={<UploadExams />} />
          <Route path="sessions" element={<LiveSessions />} />
          <Route path="queries" element={<StudentQueries />} />
          <Route path="*" element={<PlaceholderPage title="Work in progress" />} />
        </Route>
        
        <Route path="/admin" element={<DashboardLayout userRole="admin" />}>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="payments" element={<Payments />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="*" element={<PlaceholderPage title="Work in progress" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

