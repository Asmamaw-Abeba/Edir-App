// src/pages/ForgotContact.js
import React, { useState } from 'react';
import axios from 'axios';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import './css/ForgotContact.css';
import { useTranslation } from 'react-i18next'; // Add translation hook

const ForgotContact = () => {
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation(); // Add t function

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!contact) {
      setError(t('forgotContact.contact_required'));
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/forgot-contact', { contact });
      setMessage(response.data.message || t('forgotContact.success_message')); // Fallback to translated message
      const token = response.data.token;
      console.log('token = ', token);
      setTimeout(() => navigate(`/reset-contact?token=${token}`), 3000);
    } catch (error) {
      setError(error.response?.data?.message || t('forgotContact.error_message'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-contact">
      <h1>{t('forgotContact.title')}</h1>
      {error && <p className="error">{error}</p>}
      {message && <p className="message">{message}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={t('forgotContact.contact_placeholder')}
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          required
          aria-label={t('forgotContact.contact_placeholder')}
        />
        <button type="submit" disabled={loading}>
          {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : t('forgotContact.send_button')}
        </button>
      </form>
      <p>
        {t('forgotContact.remember_contact')} <a href="/login">{t('forgotContact.login_link')}</a>
      </p>
    </div>
  );
};

export default ForgotContact;