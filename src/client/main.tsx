// =============================================================================
// SOVEREIGN OXYGEN SYSTEM (S.O.S.) - CLIENT ENTRY POINT
// =============================================================================
// This file serves as the main entry point for the S.O.S. React frontend
// It initializes the React application and provides the root component

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// =============================================================================
// APPLICATION INITIALIZATION
// =============================================================================

/**
 * Main application entry point
 */
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

/**
 * Render the application
 */
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// =============================================================================
// DEVELOPMENT UTILITIES
// =============================================================================

// Enable hot module replacement in development
if (import.meta.hot) {
  import.meta.hot.accept();
}

// Log application startup
console.log('🚀 S.O.S. Client Application Starting...');
console.log('🌍 Environment:', import.meta.env.MODE);
console.log('📡 API URL:', import.meta.env.VITE_API_URL || 'http://localhost:3000'); 