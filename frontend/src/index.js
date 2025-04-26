import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './AuthContext';
import { Provider } from 'react-redux';
import store from './store/store.js';
import Header from './components/Header.js';
import { BrowserRouter as Router } from 'react-router-dom'; // Import Router

import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import './i18n/i18n'; // Import i18n configuration
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <Router> {/* Wrap everything with Router */}
        <AuthProvider> {/* AuthProvider should wrap Header and App */}
          <Header /> {/* Header now has access to AuthContext */}
          <App />
        </AuthProvider>
      </Router>
    </Provider>
  </React.StrictMode>
);

// Register the service worker
serviceWorkerRegistration.register();

// Optional: Report web vitals
reportWebVitals();