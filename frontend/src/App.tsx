import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import VerifyEmail from './components/VerifyEmail';
import Dashboard from './components/Dashboard';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import { authService } from './services/authService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowLogin(true);
    setShowForgotPassword(false);
  };

  const handleRegistrationSuccess = () => {
    setShowLogin(true);
    setShowForgotPassword(false);
  };

  if (isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard/*" element={<Dashboard onLogout={handleLogout} />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors duration-200">
              {showForgotPassword ? (
                <ForgotPassword
                  onBackToLogin={() => {
                    setShowForgotPassword(false);
                    setShowLogin(true);
                  }}
                />
              ) : showLogin ? (
                <Login
                  onSuccess={handleLoginSuccess}
                  onSwitchToRegister={() => setShowLogin(false)}
                  onSwitchToForgotPassword={() => {
                    setShowLogin(false);
                    setShowForgotPassword(true);
                  }}
                />
              ) : (
                <Register
                  onSuccess={handleRegistrationSuccess}
                  onSwitchToLogin={() => setShowLogin(true)}
                />
              )}
            </div>
          }
        />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
