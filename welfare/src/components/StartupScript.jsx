import React, { useEffect, useState } from 'react';
import { loanService } from '../services/loanService';
import { authService } from '../services/authService';

const StartupScript = ({ children }) => {
  const [isStartupComplete, setIsStartupComplete] = useState(false);
  const [startupError, setStartupError] = useState(null);

  useEffect(() => {
    const runStartup = async () => {
      try {
        // Check if backend is running by trying to fetch loan products
        await loanService.getLoanProducts();
        console.log('✅ Backend connection established');
        
        // Check if user is already logged in
        if (authService.isAuthenticated()) {
          try {
            await authService.getProfile();
            console.log('✅ User session validated');
          } catch (error) {
            console.log('⚠️ User session expired, redirecting to login');
            authService.logout();
          }
        }
        
        setIsStartupComplete(true);
      } catch (error) {
        console.error('❌ Startup failed:', error.message);
        setStartupError(error.message);
        setIsStartupComplete(true); // Still allow the app to render
      }
    };

    runStartup();
  }, []);

  if (!isStartupComplete) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ fontSize: '2rem' }}>🚀</div>
        <div>Starting Loan App...</div>
        {startupError && (
          <div style={{ 
            color: '#ef4444', 
            fontSize: '0.875rem',
            textAlign: 'center',
            maxWidth: '400px'
          }}>
            Warning: {startupError}
            <br />
            <small>The app will continue to load, but some features may not work.</small>
          </div>
        )}
      </div>
    );
  }

  return children;
};

export default StartupScript;