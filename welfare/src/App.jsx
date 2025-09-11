import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import StartupScript from './components/StartupScript';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import LoanApplication from './components/LoanApplication';
import LoanSystem from './components/LoanSystem';
import PasswordReset from './components/PasswordReset';
import ComingSoon from './components/ComingSoon';
import AdminLoansTable from './components/AdminLoansTable';
import './App.css';

function App() {
  return (
    <StartupScript>
      <AuthProvider>
        <Router>
          <div className="app">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <LoanSystem>
                      <Dashboard />
                    </LoanSystem>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/apply" 
                element={
                  <ProtectedRoute>
                    <LoanSystem>
                      <LoanApplication />
                    </LoanSystem>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/password-reset" 
                element={
                  <ProtectedRoute>
                    <LoanSystem>
                      <PasswordReset />
                    </LoanSystem>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/applications" 
                element={
                  <ProtectedRoute>
                    <LoanSystem>
                      <ComingSoon title="My Applications" description="View and track your loan applications." />
                    </LoanSystem>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/loans" 
                element={
                  <ProtectedRoute>
                    <LoanSystem>
                      <ComingSoon title="My Loans" description="Manage your active loans and payments." />
                    </LoanSystem>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/applications" 
                element={
                  <ProtectedRoute>
                    <LoanSystem>
                      <AdminLoansTable />
                    </LoanSystem>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/loans" 
                element={
                  <ProtectedRoute>
                    <LoanSystem>
                      <ComingSoon title="Loan Management" description="Manage all active loans in the system." />
                    </LoanSystem>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/products" 
                element={
                  <ProtectedRoute>
                    <LoanSystem>
                      <ComingSoon title="Loan Products" description="Create and manage loan products." />
                    </LoanSystem>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute>
                    <LoanSystem>
                      <ComingSoon title="User Management" description="Manage system users and permissions." />
                    </LoanSystem>
                  </ProtectedRoute>
                } 
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </StartupScript>
  );
}

export default App;
