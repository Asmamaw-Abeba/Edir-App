import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFilter, faSort } from '@fortawesome/free-solid-svg-icons';
import { saveData, getData } from '../utils/offlineStorage';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './css/Contributions.css';
import { useAuth } from '../AuthContext';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Contributions = ({ events = [] }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { eventName } = location.state || {};
  const { t } = useTranslation();

  const [contributions, setContributions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newContribution, setNewContribution] = useState({
    memberId: user?.name || '',
    eventId: eventName || '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'monthly',
  });
  const [formErrors, setFormErrors] = useState({});
  const [filterType, setFilterType] = useState('all');
  const [filterMemberId, setFilterMemberId] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [loading, setLoading] = useState(true);
  const [filterEventId, setFilterEventId] = useState('all');
  const [showChart, setShowChart] = useState(false);
  const chartRef = useRef(null);

  const API_BASE_URL = 'http://localhost:5000';

  useEffect(() => {
    if (showChart && chartRef.current) {
      setTimeout(() => {
        chartRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [showChart]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let storedContributions = await getData('contributions');
      if (storedContributions) setContributions(storedContributions);
      await fetchContributions();
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('contributions.toast.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchContributions = async () => {
    try {
      const response = await api.get(`/api/contributions`);
      setContributions(response.data);
      await saveData('contributions', response.data);
    } catch (error) {
      console.error('Error fetching contributions:', error);
      toast.error(t('contributions.toast.fetch_error'));
    }
  };

  // const initiatePayment = async () => {
  //   try {
  //     const paymentData = {
  //       amount: Number(newContribution.amount),
  //       currency: 'ETB',
  //       email: user?.email || 'user@gmail.com',
  //       first_name: user?.name?.split(' ')[0] || 'User',
  //       last_name: user?.name?.split(' ')[1] || 'Name',
  //       tx_ref: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  //     };

  //     localStorage.setItem('pendingContribution', JSON.stringify(newContribution));
  //     const response = await api.post(`/api/payment/initialize`, paymentData, {
  //       headers: { 'Content-Type': 'application/json' },
  //     });

  //     if (response.data?.data?.checkout_url) {
  //       window.location.href = response.data.data.checkout_url;
  //     } else {
  //       toast.error(t('contributions.toast.payment_init_error'));
  //     }
  //   } catch (err) {
  //     console.error('Error initiating payment:', err.response?.data || err.message);
  //     toast.error(t('contributions.toast.payment_error', { message: err.response?.statusText || err.message }));
  //   }
  // };

  // const verifyPayment = async (txRef) => {
  //   try {
  //     const response = await api.get(`/api/verify-payment/${txRef}`);
  //     if (response.data.status === 'success') {
  //       const savedContribution = localStorage.getItem('pendingContribution');
  //       const contribution = JSON.parse(savedContribution);
  //       await api.post(`/api/contributions`, contribution);
  //       localStorage.removeItem('pendingContribution');
  //       setNewContribution({ memberId: user?.name || '', eventId: eventName || '', amount: '', date: new Date().toISOString().split('T')[0], type: 'monthly' });
  //       setShowForm(false);
  //       await fetchContributions();
  //       toast.success(t('contributions.toast.payment_success'));
  //     } else {
  //       toast.error(t('contributions.toast.payment_verify_error', { message: response.data.message }));
  //     }
  //   } catch (error) {
  //     console.error('Error verifying payment:', error.response?.data || error.message);
  //   }
  // };

  // useEffect(() => {
  //   const urlParams = new URLSearchParams(window.location.search);
  //   const txRef = urlParams.get('tx_ref');
  //   if (txRef) {
  //     verifyPayment(txRef);
  //   }
  // }, [location.search]);

  useEffect(() => {
    const checkUserAndData = async () => {
      await fetchData();
    };
    checkUserAndData();
  }, [user, navigate]);

  const validateForm = () => {
    const errors = {};
    if (!newContribution.memberId.trim()) errors.memberId = t('contributions.validation.memberId_required');
    if (!newContribution.eventId.trim()) errors.eventId = t('contributions.validation.eventId_required');
    if (!newContribution.amount || newContribution.amount <= 0) errors.amount = t('contributions.validation.amount_invalid');
    if (!newContribution.date) errors.date = t('contributions.validation.date_required');
    else if (new Date(newContribution.date) > new Date()) errors.date = t('contributions.validation.date_future');
    if (!newContribution.type) errors.type = t('contributions.validation.type_required');
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewContribution({ ...newContribution, [name]: value });
  };

  const handleAddContribution = async () => {
    if (!validateForm()) return; // Validate form before proceeding

    try {
      // Save the new contribution to localStorage as pending
      localStorage.setItem('pendingContribution', JSON.stringify(newContribution));

      // Retrieve and parse the pending contribution
      const savedContribution = localStorage.getItem('pendingContribution');
      if (!savedContribution) {
        toast.error(t('contributions.toast.no_pending_contribution'));
        return;
      }

      const contribution = JSON.parse(savedContribution);
      if (!contribution.memberId || !contribution.eventId || !contribution.amount) {
        toast.error(t('contributions.toast.invalid_contribution'));
        return;
      }

      // Submit to backend
      const response = await api.post('/api/contributions', contribution);
      if (response.status === 201) {
        localStorage.removeItem('pendingContribution'); // Clear pending contribution
        setNewContribution({
          memberId: user?.name || '',
          eventId: eventName || '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          type: 'monthly',
        });
        setShowForm(false); // Hide form on success
        await fetchContributions(); // Refresh contributions list
        toast.success(t('contributions.toast.payment_success'));
      } else {
        toast.error(t('contributions.toast.payment_verify_error', { message: response.data.message }));
      }
    } catch (error) {
      console.error('Error adding contribution:', error.response?.data || error.message);
      toast.error(
        t('contributions.toast.payment_error', {
          message: error.response?.data?.message || error.message,
        })
      );
    }

    // Uncomment below when integrating payment gateway
    // if (!validateForm()) return;
    // await initiatePayment();
  };

  const filteredContributions = contributions.filter((contribution) => {
    const typeFilter = filterType === 'all' ? true : contribution.type === filterType;
    const eventFilter = filterEventId === 'all' ? true : contribution.eventId === filterEventId;
    const memberFilter = filterMemberId === 'all' ? true : contribution.memberId === filterMemberId;
    return typeFilter && eventFilter && memberFilter;
  });

  const sortedContributions = filteredContributions.sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(a.date) - new Date(b.date);
    } else if (sortBy === 'amount') {
      return a.amount - b.amount;
    }
    return 0;
  });

  const totalContributions = filteredContributions.reduce(
    (total, contribution) => total + Number(contribution.amount),
    0
  );

  const contributionsByMember = filteredContributions.reduce((acc, curr) => {
    acc[curr.memberId] = (acc[curr.memberId] || 0) + Number(curr.amount);
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(contributionsByMember),
    datasets: [
      {
        label: t('contributions.report_chart_title'),
        data: Object.values(contributionsByMember),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    scales: {
      y: { beginAtZero: true, title: { display: true, text: t('contributions.table_amount') } },
      x: { title: { display: true, text: t('contributions.table_member_name') } },
    },
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: t('contributions.report_chart_title') },
    },
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(t('contributions.report_title'), 14, 22);
    doc.setFontSize(12);
    doc.text(`${t('contributions.report_total')}: ${formatCurrency(totalContributions)}`, 14, 32);
    doc.text(`${t('contributions.report_generated')}: ${formatDate(new Date())}`, 14, 40);
    const headers = [[
      t('contributions.table_member_name'),
      t('contributions.table_amount'),
      t('contributions.table_date'),
      t('contributions.table_event_name'),
      t('contributions.table_type'),
    ]];
    const data = sortedContributions.map((contribution) => [
      contribution.memberId,
      formatCurrency(contribution.amount),
      formatDate(contribution.date),
      contribution.eventId,
      contribution.type,
    ]);
    autoTable(doc, {
      startY: 50,
      head: headers,
      body: data,
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [75, 192, 192] },
    });
    doc.save('Edir_contribution_report.pdf');
  };

  const uniqueMemberIds = [...new Set(contributions.map((c) => c.memberId))];

  if (loading) {
    return (
      <motion.div className="contributions loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <CircularProgress size={60} />
        <p>{t('contributions.loading')}</p>
      </motion.div>
    );
  }

  return (
    <div className="contributions">
      <h1>{t('contributions.title')}</h1>
      <Button
        variant="contained"
        color="primary"
        startIcon={<FontAwesomeIcon icon={faPlus} />}
        onClick={() => setShowForm(!showForm)}
        sx={{ mb: 2 }}
      >
        {showForm ? t('contributions.hide_form') : t('contributions.add_contribution')}
      </Button>

      {showForm && (
        <motion.div
          className="contribution-form"
          variants={{
            hidden: { opacity: 0, scale: 0.9 },
            visible: { opacity: 1, scale: 1 },
          }}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('contributions.form_title')}
            </Typography>
            <TextField
              fullWidth
              label={t('contributions.event_name_label')}
              name="eventId"
              value={newContribution.eventId}
              onChange={handleInputChange}
              error={!!formErrors.eventId}
              helperText={formErrors.eventId}
              margin="normal"
              variant="outlined"
            />
            <TextField
              fullWidth
              label={t('contributions.member_name_label')}
              name="memberId"
              value={newContribution.memberId}
              onChange={handleInputChange}
              error={!!formErrors.memberId}
              helperText={formErrors.memberId}
              margin="normal"
              variant="outlined"
            />
            <TextField
              fullWidth
              label={t('contributions.amount_label')}
              name="amount"
              type="number"
              value={newContribution.amount}
              onChange={handleInputChange}
              error={!!formErrors.amount}
              helperText={formErrors.amount}
              margin="normal"
              variant="outlined"
            />
            <TextField
              fullWidth
              label={t('contributions.date_label')}
              name="date"
              type="date"
              value={newContribution.date}
              onChange={handleInputChange}
              error={!!formErrors.date}
              helperText={formErrors.date}
              margin="normal"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>{t('contributions.type_label')}</InputLabel>
              <Select
                name="type"
                value={newContribution.type}
                onChange={handleInputChange}
                error={!!formErrors.type}
                label={t('contributions.type_label')}
              >
                <MenuItem value="monthly">{t('contributions.type_monthly')}</MenuItem>
                <MenuItem value="event">{t('contributions.type_event')}</MenuItem>
                <MenuItem value="other">{t('contributions.type_other')}</MenuItem>
              </Select>
              {formErrors.type && <Typography color="error" variant="caption">{formErrors.type}</Typography>}
            </FormControl>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddContribution}
              sx={{ mt: 2 }}
              fullWidth
            >
              <FontAwesomeIcon icon={faPlus} style={{ marginRight: 8 }} /> {t('contributions.pay_now')}
            </Button>
          </Box>
        </motion.div>
      )}

      <div className="filter-sort">
        <label>
          <FontAwesomeIcon icon={faFilter} /> {t('contributions.filter_by_type')}:
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">{t('contributions.filter_all')}</option>
            <option value="monthly">{t('contributions.type_monthly')}</option>
            <option value="event">{t('contributions.type_event')}</option>
            <option value="other">{t('contributions.type_other')}</option>
          </select>
        </label>
        <label>
          <FontAwesomeIcon icon={faFilter} /> {t('contributions.filter_by_event')}:
          <select value={filterEventId} onChange={(e) => setFilterEventId(e.target.value)}>
            <option value="all">{t('contributions.filter_all')}</option>
            {events.map((event) => (
              <option key={event._id} value={event.name}>
                {event.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <FontAwesomeIcon icon={faFilter} /> {t('contributions.filter_by_member')}:
          <select value={filterMemberId} onChange={(e) => setFilterMemberId(e.target.value)}>
            <option value="all">{t('contributions.filter_all')}</option>
            {uniqueMemberIds.map((memberId) => (
              <option key={memberId} value={memberId}>
                {memberId}
              </option>
            ))}
          </select>
        </label>
        <label>
          <FontAwesomeIcon icon={faSort} /> {t('contributions.sort_by')}:
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">{t('contributions.sort_date')}</option>
            <option value="amount">{t('contributions.sort_amount')}</option>
          </select>
        </label>
      </div>

      <div className="summary-card">
        <h3>{t('contributions.total_contributions_title')}</h3>
        <p>{formatCurrency(totalContributions)}</p>
      </div>

      <div className="contribution-list">
        <h2>{t('contributions.contributions_title')}</h2>
        {sortedContributions.length === 0 ? (
          <p>{t('contributions.no_contributions')}</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t('contributions.table_member_name')}</th>
                  <th>{t('contributions.table_amount')}</th>
                  <th>{t('contributions.table_date')}</th>
                  <th>{t('contributions.table_event_name')}</th>
                  <th>{t('contributions.table_type')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedContributions.map((contribution) => (
                  <tr key={contribution._id}>
                    <td>{contribution.memberId}</td>
                    <td>{formatCurrency(contribution.amount)}</td>
                    <td>{formatDate(contribution.date)}</td>
                    <td>{contribution.eventId}</td>
                    <td>{contribution.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="report-section">
        <div className="report-buttons">
          <button
            onClick={() => setShowChart(!showChart)}
            className="button report-button"
          >
            {showChart ? t('contributions.hide_chart') : t('contributions.show_chart')}
          </button>
          <button onClick={downloadPDF} className="button report-button">
            {t('contributions.download_pdf')}
          </button>
        </div>
        {showChart && (
          <motion.div
            ref={chartRef}
            className="chart-container"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.5 }}
          >
            <h3>{t('contributions.report_chart_title')}</h3>
            <Bar data={chartData} options={chartOptions} />
          </motion.div>
        )}
      </div>

      <ToastContainer />
    </div>
  );
};

export default Contributions;