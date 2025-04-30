import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './AuthContext';
import { Provider } from 'react-redux';
import store from './store/store.js';
import Header from './components/Header.js';
import { BrowserRouter as Router } from 'react-router-dom'; // Import Router

// import * as serviceWorkerRegistration from './serviceWorkerRegistration';
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

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
reportWebVitals();