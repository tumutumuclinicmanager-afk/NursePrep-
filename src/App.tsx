/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

import QuizGeneratorPage from './pages/QuizGeneratorPage';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-12 text-center text-xl text-slate-500 font-serif border-2 border-dashed border-slate-200 rounded-2xl m-4">
      {title} coming soon...
    </div>
  );
}

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole?: string }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const userRole = localStorage.getItem('userRole');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user && !userRole) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && userRole && userRole !== allowedRole) {
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'staff') return <Navigate to="/staff" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function PublicOrDashboardExams() {
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'student' || auth.currentUser) {
    return <Navigate to="/dashboard/exams" replace />;
  }
  if (userRole === 'staff') {
    return <Navigate to="/staff/upload" replace />;
  }
  if (userRole === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return <ExamBank />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<PlaceholderPage title="Courses" />} />
          <Route path="/exams" element={<PublicOrDashboardExams />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<PlaceholderPage title="About Us" />} />
          <Route path="/contact" element={<PlaceholderPage title="Contact" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRole="student">
              <DashboardLayout userRole="student" />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="exams" element={<ExamBank />} />
          <Route path="generator" element={<QuizGeneratorPage />} />
          <Route path="courses" element={<PlaceholderPage title="My Courses" />} />
          <Route path="performance" element={<PlaceholderPage title="Performance Metrics" />} />
          <Route path="*" element={<PlaceholderPage title="Work in progress" />} />
        </Route>

        <Route 
          path="/staff" 
          element={
            <ProtectedRoute allowedRole="staff">
              <DashboardLayout userRole="staff" />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/staff/upload" replace />} />
          <Route path="upload" element={<UploadExams />} />
          <Route path="sessions" element={<LiveSessions />} />
          <Route path="queries" element={<StudentQueries />} />
          <Route path="*" element={<PlaceholderPage title="Work in progress" />} />
        </Route>
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRole="admin">
              <DashboardLayout userRole="admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="questions" element={<UploadExams />} />
          <Route path="upload" element={<UploadExams />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="payments" element={<Payments />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="*" element={<PlaceholderPage title="Work in progress" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

