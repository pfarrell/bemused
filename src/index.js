// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Mount React to the #react-app element in the main content area
const mountElement = document.getElementById('react-app');

if (mountElement) {
  const root = ReactDOM.createRoot(mountElement);
  root.render(<App />);
} else {
  console.error('Could not find mounting element #react-app');
}
