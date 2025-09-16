import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import StartupScript from './components/StartupScript';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import LoanApplication from './components/Loans/LoanApplication';
import LoanSystem from './components/Loans/LoanSystem';
import PasswordReset from './components/PasswordReset/PasswordReset';
import ComingSoon from './components/CommingSoon/ComingSoon';
import AdminLoansTable from './components/AdminLoansTable/AdminLoansTable';
import ApplicationsPage from './components/ApplicationPages/ApplicationsPage';
import UsersPage from './components/Users/UsersPage';
import AdminLoanManagement from './components/AdminLoanManagement/AdminLoanManagement';
import CustomerLoans from './components/CustomerLoans/CustomerLoans';
import Contributions from './components/Contributions/Contributions';
import Expenditures from './components/Expenditure/Expenditures';
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
                      <ApplicationsPage />
                    </LoanSystem>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/loans" 
                element={
                  <ProtectedRoute>
                    <LoanSystem>
                      <CustomerLoans />
                    </LoanSystem>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/contributions" 
                element={
                  <ProtectedRoute>
                    <LoanSystem>
                      <Contributions />
                    </LoanSystem>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/expenditures" 
                element={
                  <ProtectedRoute>
                    <LoanSystem>
                      <Expenditures />
                    </LoanSystem>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/loans" 
                element={
                  <ProtectedRoute>
                    <LoanSystem>
                      <AdminLoanManagement />
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
                      <UsersPage />
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
