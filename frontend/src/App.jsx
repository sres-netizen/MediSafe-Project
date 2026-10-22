import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const showLoginMode = window.location.search.includes('login');
  const [clinicianUser, setClinicianUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setClinicianUser(userData);
  };

  const handleLogout = () => {
    setClinicianUser(null);
  };

  return (
    <ErrorBoundary>
      <div className="app-root">
        {showLoginMode && !clinicianUser ? (
          <Login onLoginSuccess={handleLoginSuccess} />
        ) : (
          <Dashboard
            user={clinicianUser}
            onLogout={clinicianUser ? handleLogout : undefined}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
