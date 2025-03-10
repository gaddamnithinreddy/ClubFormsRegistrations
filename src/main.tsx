import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/animations.css';

console.log('Main script execution started');
console.log('React version:', React.version);

try {
  const container = document.getElementById('root');
  console.log('Root container found:', !!container);

  if (!container) {
    throw new Error('Failed to find root element');
  }

  // Clear any existing content
  container.innerHTML = '';

  console.log('Creating React root');
  const root = createRoot(container);

  console.log('Starting React render');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('React render initiated');
} catch (error) {
  console.error('Fatal error during app initialization:', error);
  // Display error in the loading status
  const statusEl = document.getElementById('load-status');
  if (statusEl) {
    statusEl.textContent = 'Error: Failed to initialize application';
    statusEl.style.color = '#ef4444'; // Red color
  }
}