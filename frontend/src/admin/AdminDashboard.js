import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faDollarSign, faUsers, faPlus } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './css/AdminDashboard.css';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next'; // Add translation hook

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(); // Add t function
  
  // useEffect(() => {
  //   if (!user) {
  //     navigate('/');
  //   }
  // }, [user, navigate]);

  const [totalEvents, setTotalEvents] = useState(0);
  const [totalContributions, setTotalContributions] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://localhost:5000';

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/'); // Redirect if not admin
    } else {
      fetchDashboardData();
    }
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsResponse, contributionsResponse, membersResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/events`),
        axios.get(`${API_BASE_URL}/api/contributions`),
        axios.get(`${API_BASE_URL}/api/members`),
      ]);

      setTotalEvents(eventsResponse.data.length);
      setTotalContributions(
        contributionsResponse.data.reduce((sum, contribution) => sum + contribution.amount, 0)
      );
      setTotalMembers(membersResponse.data.length);
    } catch (err) {
      setError(t('adminDashboard.error'));
      toast.error(t('adminDashboard.toast.error'));
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <motion.div
        className="dashboard loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <p>{t('adminDashboard.loading')}</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="dashboard error"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <p>{error}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1>{t('adminDashboard.title')}</h1>

      <div className="dashboard-stats">
        <motion.div
          className="stat-card"
          whileHover={{ scale: 1.05 }}
          onClick={() => handleNavigation('/admin/events')}
        >
          <FontAwesomeIcon icon={faCalendarAlt} className="stat-icon" />
          <h2>{t('adminDashboard.total_events')}</h2>
          <p>{totalEvents}</p>
        </motion.div>

        <motion.div
          className="stat-card"
          whileHover={{ scale: 1.05 }}
          onClick={() => handleNavigation('/contributions')}
        >
          <FontAwesomeIcon icon={faDollarSign} className="stat-icon" />
          <h2>{t('adminDashboard.total_contributions')}</h2>
          <p>{formatCurrency(totalContributions)}</p>
        </motion.div>

        <motion.div
          className="stat-card"
          whileHover={{ scale: 1.05 }}
          onClick={() => handleNavigation('/members')}
        >
          <FontAwesomeIcon icon={faUsers} className="stat-icon" />
          <h2>{t('adminDashboard.total_members')}</h2>
          <p>{totalMembers}</p>
        </motion.div>
      </div>

      <div className="quick-actions">
        <h2>{t('adminDashboard.quick_actions')}</h2>
        <div className="action-buttons">
          <button
            className="action-button"
            onClick={() => handleNavigation('/admin/events')}
          >
            <FontAwesomeIcon icon={faCalendarAlt} /> {t('adminDashboard.manage_events')}
          </button>
          <button
            className="action-button"
            onClick={() => handleNavigation('/contributions')}
          >
            <FontAwesomeIcon icon={faDollarSign} /> {t('adminDashboard.track_contributions')}
          </button>
          <button
            className="action-button"
            onClick={() => handleNavigation('/register')}
          >
            <FontAwesomeIcon icon={faPlus} /> {t('adminDashboard.add_new_member')}
          </button>
          <button
            className="action-button"
            onClick={() => handleNavigation('/members')}
          >
            <FontAwesomeIcon icon={faUsers} /> {t('adminDashboard.manage_members')}
          </button>
        </div>
      </div>

      <ToastContainer />
    </motion.div>
  );
};

export default AdminDashboard;