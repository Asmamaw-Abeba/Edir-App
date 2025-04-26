import React, { useState, useCallback } from 'react';
import axios from 'axios';
import api from '../api'; // Adjust path based on your structure
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { styled } from '@mui/system';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../AuthContext';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next'; // Add translation hook
import i18n from '../i18n/i18n'; // Import to check language

// Basic sanitization function to prevent XSS
const sanitizeInput = (input) => {
  return input.replace(/[<>&"']/g, '');
};

const StyledForm = styled('form')({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  maxWidth: '400px',
  width: '100%',
});

const Login = () => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { t } = useTranslation(); // Add t function

  console.log('Current language:', i18n.language); // Debug language
  // Validation functions matching backend
  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
    if (!name) return t('login.validation.name_required');
    if (!nameRegex.test(name)) {
      return t('login.validation.name_invalid');
    }
    return '';
  };

  const validateContact = (contact) => {
    const phoneRegex = /^(09|\+2519)\d{8}$/;
    if (!contact) return t('login.validation.contact_required');
    if (!phoneRegex.test(contact)) {
      return t('login.validation.contact_invalid');
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return t('login.validation.password_required');
    if (password.length < 8) return t('login.validation.password_short');
    return '';
  };

  const validateRole = (role) => {
    const validRoles = ['member', 'admin'];
    if (!role) return t('login.validation.role_required');
    if (!validRoles.includes(role)) return t('login.validation.role_invalid');
    return '';
  };

  // Stabilized handlers with validation
  const handleNameChange = useCallback((e) => {
    const value = sanitizeInput(e.target.value);
    setName(value);
    setErrors((prev) => ({ ...prev, name: validateName(value) }));
  }, []);

  const handleContactChange = useCallback((e) => {
    const value = e.target.value.replace(/[^+\d]/g, '');
    setContact(value);
    setErrors((prev) => ({ ...prev, contact: validateContact(value) }));
  }, []);

  const handlePasswordChange = useCallback((e) => {
    const value = e.target.value;
    setPassword(value);
    setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
  }, []);

  const handleRoleChange = useCallback((e) => {
    const value = e.target.value;
    setRole(value);
    setErrors((prev) => ({ ...prev, role: validateRole(value) }));
  }, []);

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const validateForm = () => {
    const newErrors = {
      name: validateName(name),
      contact: validateContact(contact),
      password: validatePassword(password),
      role: validateRole(role),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const sanitizedData = {
        name: sanitizeInput(name.trim()),
        contact: contact.trim(),
        password,
        role,
      };

      const response = await api.post('/api/login', sanitizedData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      const { token } = response.data;
      // console.log(token)
      login(token);
      localStorage.setItem('token', token);
      const decodedToken = jwtDecode(token);
      const { role: userRole } = decodedToken;

      const queryParams = new URLSearchParams(location.search);
      const redirectTo = queryParams.get('redirect') || (userRole === 'admin' ? '/admin/dashboard' : '/events');

      navigate(redirectTo);
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || t('login.validation.general_error');
      console.log(errorMessage);
      console.log( t('login.validation.general_error'));
      setErrors((prev) => ({ ...prev, general: errorMessage }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        {t('login.title')}
      </Typography>
      {errors.general && <Typography variant="body2" color="error" gutterBottom>{errors.general}</Typography>}
      <StyledForm onSubmit={handleLogin} noValidate>
        <TextField
          label={t('login.name_label')}
          type="text"
          value={name}
          onChange={handleNameChange}
          error={!!errors.name}
          helperText={errors.name}
          required
          aria-label={t('login.name_label')}
          inputProps={{ maxLength: 50 }}
        />
        <TextField
          label={t('login.contact_label')}
          type="text"
          value={contact}
          onChange={handleContactChange}
          error={!!errors.contact}
          helperText={errors.contact || t('login.contact_placeholder')}
          required
          aria-label={t('login.contact_label')}
          placeholder={t('login.contact_placeholder')}
          inputProps={{ maxLength: 13 }}
        />
        <TextField
          label={t('login.password_label')}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={handlePasswordChange}
          error={!!errors.password}
          helperText={errors.password || t('login.validation.password_short')}
          required
          aria-label={t('login.password_label')}
          placeholder={t('login.password_placeholder')}
          inputProps={{ maxLength: 128 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleTogglePasswordVisibility}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <FormControl fullWidth error={!!errors.role}>
          <InputLabel id="role-label">{t('login.role_label')}</InputLabel>
          <Select
            labelId="role-label"
            value={role}
            onChange={handleRoleChange}
            aria-label={t('login.role_label')}
          >
            <MenuItem value="member">{t('login.role_member')}</MenuItem>
            <MenuItem value="admin">{t('login.role_admin')}</MenuItem>
          </Select>
          {errors.role && <Typography variant="caption" color="error">{errors.role}</Typography>}
        </FormControl>
        <Button
          variant="contained"
          type="submit"
          disabled={loading || Object.values(errors).some(err => err && err !== errors.general)}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : t('login.login_button')}
        </Button>
      </StyledForm>
      <Typography variant="body2" sx={{ mt: 2 }}>
        {t('login.no_account')} <a href="/register">{t('login.register_link')}</a>
      </Typography>
      <Button variant="text" onClick={() => navigate('/forgot-contact')} sx={{ mt: 1 }}>
        {t('login.forgot_contact')}
      </Button>
    </motion.div>
  );
};

export default Login;