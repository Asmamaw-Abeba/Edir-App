import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import api from '../api'; // Adjust path based on your structure
import { useNavigate } from 'react-router-dom';
import './css/Register.css';
import { useAuth } from '../AuthContext';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { styled } from '@mui/system';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next'; // Add translation hook

const StyledForm = styled('form')({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  maxWidth: '400px',
  width: '100%',
});

const Register = () => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('member');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation(); // Add t function

  // Refs for focus management
  const nameInputRef = useRef(null);
  const contactInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  // Validation functions
  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
    if (!name) return t('register.validation.name_required');
    if (!nameRegex.test(name)) {
      return t('register.validation.name_invalid');
    }
    return '';
  };

  const validateContact = (contact) => {
    const phoneRegex = /^(09|\+2519)\d{8}$/;
    if (!contact) return t('register.validation.contact_required');
    if (!phoneRegex.test(contact)) {
      return t('register.validation.contact_invalid');
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return t('register.validation.password_required');
    if (password.length < 8) return t('register.validation.password_short');
    // if (!/[A-Z]/.test(password)) return t('register.validation.password_uppercase');
    // if (!/[0-9]/.test(password)) return t('register.validation.password_number');
    // if (!/[!@#$%^&*]/.test(password)) return t('register.validation.password_special');
    return '';
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return t('register.validation.confirm_password_required');
    if (confirmPassword !== password) return t('register.validation.confirm_password_mismatch');
    return '';
  };

  const validateRole = (role) => {
    const validRoles = ['member', 'admin'];
    if (!validRoles.includes(role)) return t('register.validation.role_invalid');
    return '';
  };

  // Stabilized handlers with validation
  const handleNameChange = useCallback((e) => {
    const value = e.target.value;
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
    setErrors((prev) => ({
      ...prev,
      password: validatePassword(value),
      confirmPassword: validateConfirmPassword(confirmPassword, value),
    }));
  }, [confirmPassword]);

  const handleConfirmPasswordChange = useCallback((e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(value, password) }));
  }, [password]);

  const handleRoleChange = useCallback((e) => {
    const value = e.target.value;
    setRole(value);
    setErrors((prev) => ({ ...prev, role: validateRole(value) }));
  }, []);

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {
      name: validateName(name),
      contact: validateContact(contact),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(confirmPassword, password),
      role: validateRole(role),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  };

  // Handle form submission
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      setSnackbarMessage(t('register.validation.form_errors'));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await api.post('/api/register', {
        name: name.trim(),
        contact: contact.trim(),
        password,
        role,
      });

      const { token } = response.data;
      register(token);

      setSnackbarMessage(t('register.validation.success'));
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || t('register.validation.general_error');
      setErrors((prev) => ({ ...prev, general: errorMessage }));
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Focus management
  useEffect(() => {
    if (document.activeElement === nameInputRef.current?.input) nameInputRef.current.focus();
    if (document.activeElement === contactInputRef.current?.input) contactInputRef.current.focus();
    if (document.activeElement === passwordInputRef.current?.input) passwordInputRef.current.focus();
    if (document.activeElement === confirmPasswordInputRef.current?.input) confirmPasswordInputRef.current.focus();
  }, [name, contact, password, confirmPassword]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        {t('register.title')}
      </Typography>
      {errors.general && (
        <Typography variant="body2" color="error" gutterBottom>
          {errors.general}
        </Typography>
      )}
      <StyledForm onSubmit={handleRegister} noValidate>
        <TextField
          inputRef={nameInputRef}
          label={t('register.name_label')}
          type="text"
          value={name}
          onChange={handleNameChange}
          error={!!errors.name}
          helperText={errors.name}
          required
          aria-label={t('register.name_label')}
          placeholder={t('register.name_placeholder')}
          inputProps={{ maxLength: 50 }}
        />
        <TextField
          inputRef={contactInputRef}
          label={t('register.contact_label')}
          type="text"
          value={contact}
          onChange={handleContactChange}
          error={!!errors.contact}
          helperText={errors.contact || t('register.validation.contact_invalid')}
          required
          aria-label={t('register.contact_label')}
          placeholder={t('register.contact_placeholder')}
          inputProps={{ maxLength: 13 }}
        />
        <TextField
          inputRef={passwordInputRef}
          label={t('register.password_label')}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={handlePasswordChange}
          error={!!errors.password}
          helperText={errors.password || t('register.validation.password_short')}
          required
          aria-label={t('register.password_label')}
          placeholder={t('register.password_placeholder')}
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
        <TextField
          inputRef={confirmPasswordInputRef}
          label={t('register.confirm_password_label')}
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
          required
          aria-label={t('register.confirm_password_label')}
          placeholder={t('register.confirm_password_placeholder')}
          inputProps={{ maxLength: 128 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle confirm password visibility"
                  onClick={handleToggleConfirmPasswordVisibility}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <FormControl fullWidth error={!!errors.role}>
          <InputLabel id="role-label">{t('register.role_label')}</InputLabel>
          <Select
            labelId="role-label"
            value={role}
            onChange={handleRoleChange}
            aria-label={t('register.role_label')}
          >
            <MenuItem value="member">{t('register.role_member')}</MenuItem>
            <MenuItem value="admin">{t('register.role_admin')}</MenuItem>
          </Select>
          {errors.role && <Typography variant="caption" color="error">{errors.role}</Typography>}
        </FormControl>
        <Button
          variant="contained"
          type="submit"
          disabled={loading || Object.values(errors).some(err => err && err !== errors.general)}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : t('register.register_button')}
        </Button>
      </StyledForm>
      <Typography variant="body2" sx={{ mt: 2 }}>
        {t('register.have_account')} <a href="/login">{t('register.login_link')}</a>
      </Typography>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Register;