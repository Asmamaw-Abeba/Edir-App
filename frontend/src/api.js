// src/api.js
import axios from 'axios';
import i18n from './i18n/i18n.js'; // Your i18n configuration file

const api = axios.create({
  baseURL: 'http://localhost:5000', // Your backend base URL
  withCredentials: true, // Include cookies (e.g., for JWT in your auth routes)
});

// Add a request interceptor to include the language header
api.interceptors.request.use(
  (config) => {
    // const token = localStorage.getItem('token');
    // console.log('Sending token:', token); // Debug
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // } else {
    //   console.warn('No token found in localStorage');
    // }
    // Get the current language from i18n
    const language = i18n.language || 'en'; // Fallback to 'en' if undefined
    config.headers['x-language'] = language; // Set the custom header
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;