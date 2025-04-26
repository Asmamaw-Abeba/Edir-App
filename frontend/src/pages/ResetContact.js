// src/pages/ResetContact.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import './css/ResetContact.css';
import { useTranslation } from 'react-i18next'; // Add translation hook

// Use environment variable or config for API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ResetContact = () => {
  const [newContact, setNewContact] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(); // Add t function

  const token = new URLSearchParams(location.search).get('token');

  // Check if token exists on mount
  useEffect(() => {
    if (!token) {
      setError(t('resetContact.invalid_token'));
    }
  }, [token, t]); // Add t to dependency array

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError(t('resetContact.no_token_submit'));
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    if (!newContact || newContact.length < 6) {
      setError(t('resetContact.contact_short'));
      setLoading(false);
      return;
    }

    try {
      const response = await api.post(`/api/reset-contact`, { 
        token, 
        newContact 
      });
      setMessage(t('resetContact.success_message'));
      setTimeout(() => navigate('/login'), 5000);
    } catch (error) {
      setError(error.response?.data?.message || t('resetContact.error_message'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-contact">
      <h1>{t('resetContact.title')}</h1>
      {error && <p className="error">{error}</p>}
      {message && <p className="message">{message}</p>}
      {!token ? (
        <p>{t('resetContact.no_token')}</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder={t('resetContact.new_contact_placeholder')}
            value={newContact}
            onChange={(e) => setNewContact(e.target.value)}
            required
            aria-label={t('resetContact.new_contact_placeholder')}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !token}>
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : t('resetContact.reset_button')}
          </button>
        </form>
      )}
    </div>
  );
};

export default ResetContact;