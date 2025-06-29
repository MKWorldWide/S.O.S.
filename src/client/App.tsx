// =============================================================================
// SOVEREIGN OXYGEN SYSTEM (S.O.S.) - MAIN APP COMPONENT
// =============================================================================
// This file contains the main App component for the S.O.S. React frontend
// It provides the application layout, routing, and global state management

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress, Alert } from '@mui/material';

// Import components
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Dashboard from '@/components/pages/Dashboard';
import Devices from '@/components/pages/Devices';
import Alerts from '@/components/pages/Alerts';
import Users from '@/components/pages/Users';
import Settings from '@/components/pages/Settings';
import Login from '@/components/pages/Login';

// Import hooks and utilities
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAlerts } from '@/hooks/useAlerts';

// Import styles
import './App.css';

// =============================================================================
// THEME CONFIGURATION
// =============================================================================

/**
 * Material-UI theme configuration for the S.O.S. application
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // Blue - Trust, reliability
    },
    secondary: {
      main: '#059669', // Green - Safety, health
    },
    warning: {
      main: '#d97706', // Orange - Caution
    },
    error: {
      main: '#dc2626', // Red - Emergency
    },
    success: {
      main: '#059669', // Green - Normal operation
    },
    info: {
      main: '#0891b2', // Cyan - Information
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

// =============================================================================
// APP COMPONENT
// =============================================================================

/**
 * Main App component for the S.O.S. application
 */
const App: React.FC = () => {
  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Custom hooks
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isConnected: wsConnected } = useWebSocket();
  const { alerts, unreadCount } = useAlerts();

  // ===========================================================================
  // EFFECTS
  // ===========================================================================

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Handle authentication errors
    if (!authLoading && !isAuthenticated && window.location.pathname !== '/login') {
      // Redirect to login if not authenticated
    }
  }, [isAuthenticated, authLoading]);

  // ===========================================================================
  // EVENT HANDLERS
  // ===========================================================================

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  // Show loading screen
  if (isLoading || authLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          flexDirection="column"
          gap={2}
        >
          <CircularProgress size={60} />
          <h2>Loading S.O.S. System...</h2>
        </Box>
      </ThemeProvider>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Login onError={handleError} />
      </ThemeProvider>
    );
  }

  // Main application layout
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main content */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Header
            onMenuClick={handleSidebarToggle}
            user={user}
            alertsCount={unreadCount}
            wsConnected={wsConnected}
          />
          
          {/* Error alert */}
          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ m: 2 }}
            >
              {error}
            </Alert>
          )}
          
          {/* Main content area */}
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/devices" element={<Devices />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/users" element={<Users />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App; 