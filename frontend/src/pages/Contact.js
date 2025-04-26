// src/pages/Contact.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './css/Contact.css';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next'; // Add translation hook

const Contact = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(); // Add t function
  const [formData, setFormData] = useState({
    name: user?.name || '',
    contact: user?.contact || '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Validation functions
  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
    if (!name) return t('contact.validation.name_required');
    if (!nameRegex.test(name)) {
      return t('contact.validation.name_invalid');
    }
    return '';
  };

  const validateContact = (contact) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(09|\+2519)\d{8}$/;
    
    if (!contact) return t('contact.validation.contact_required');
    
    const isEmail = emailRegex.test(contact);
    const isPhone = phoneRegex.test(contact);
    
    if (!isEmail && !isPhone) {
      return t('contact.validation.contact_invalid');
    }
    return '';
  };

  const validateMessage = (message) => {
    if (!message) return t('contact.validation.message_required');
    if (message.length < 10) return t('contact.validation.message_too_short');
    if (message.length > 1000) return t('contact.validation.message_too_long');
    return '';
  };

  // Handle input changes with real-time validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === 'contact' && !value.includes('@')) {
      formattedValue = value.replace(/[^+\d]/g, '');
    }
    
    setFormData((prev) => ({ ...prev, [name]: formattedValue }));

    let error = '';
    switch (name) {
      case 'name':
        error = validateName(formattedValue);
        break;
      case 'contact':
        error = validateContact(formattedValue);
        break;
      case 'message':
        error = validateMessage(formattedValue);
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Validate all fields before submission
  const validateForm = () => {
    const newErrors = {
      name: validateName(formData.name),
      contact: validateContact(formData.contact),
      message: validateMessage(formData.message),
    };
    
    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      navigate('/login?redirect=/contact');
      return;
    }

    if (!validateForm()) {
      toast.error(t('contact.validation.form_errors'));
      return;
    }

    setLoading(true);
    try {
      const API_BASE_URL = '/api/contact';
      const response = await api.post(API_BASE_URL, {
        name: formData.name.trim(),
        contact: formData.contact.trim(),
        message: formData.message.trim(),
      });

      toast.success(t('contact.validation.success'));
      setFormData({ name: '', contact: '', message: '' });
      setErrors({});
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error.response?.data?.message || t('contact.validation.error');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact">
      <section className="contact-hero">
        <h1>{t('contact.hero_title')}</h1>
        <p>{t('contact.hero_description')}</p>
      </section>

      <section className="contact-form">
        <h2>{t('contact.form_title')}</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder={t('contact.name_placeholder')}
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <input
              type="text"
              name="contact"
              placeholder={t('contact.contact_placeholder')}
              value={formData.contact}
              onChange={handleChange}
              disabled={loading}
              className={errors.contact ? 'error' : ''}
            />
            {errors.contact && <span className="error-message">{errors.contact}</span>}
          </div>

          <div className="form-group">
            <textarea
              name="message"
              placeholder={t('contact.message_placeholder')}
              rows="5"
              value={formData.message}
              onChange={handleChange}
              disabled={loading}
              className={errors.message ? 'error' : ''}
            ></textarea>
            {errors.message && <span className="error-message">{errors.message}</span>}
            <small className="char-count">
              {t('contact.char_count', { count: formData.message.length })}
            </small>
          </div>

          <button type="submit" disabled={loading || Object.values(errors).some(err => err)}>
            {loading ? t('contact.sending') : user ? t('contact.send_button') : t('contact.login_to_send')}
          </button>
        </form>
      </section>

      <section className="contact-info">
        <h2>{t('contact.info_title')}</h2>
        <p>
          {t('contact.email_label')}: <a href={`mailto:${t('contact.email_value')}`}>{t('contact.email_value')}</a>
        </p>
        <p>
          {t('contact.phone_label')}: <a href={`tel:${t('contact.phone_value')}`}>{t('contact.phone_value')}</a>
        </p>
        <p>
          {t('contact.address_label')}: {t('contact.address_value')}
        </p>
      </section>

      <ToastContainer />
    </div>
  );
};

export default Contact;