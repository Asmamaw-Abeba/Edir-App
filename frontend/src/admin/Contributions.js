

// export default Contributions;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFilter, faSort } from '@fortawesome/free-solid-svg-icons';
import { saveData, getData } from '../utils/offlineStorage';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './css/Contributions.css';

const Contributions = ({ events = [] }) => {
  const [contributions, setContributions] = useState([]);
  const [newContribution, setNewContribution] = useState({
    memberId: '',
    eventId: '',
    amount: '',
    date: '',
    type: 'monthly',
  });
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [loading, setLoading] = useState(true);
  const [filterEventId, setFilterEventId] = useState('all');

  const API_BASE_URL = 'https://edir-if1t.onrender.com';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let storedContributions = await getData('contributions');
      if (storedContributions) {
        setContributions(storedContributions);
      }
      await fetchContributions();
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data. Using offline data if available.');
    } finally {
      setLoading(false);
    }
  };

  const fetchContributions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/contributions`);
      setContributions(response.data);
      await saveData('contributions', response.data);
    } catch (error) {
      console.error('Error fetching contributions from API:', error);
      toast.error('Failed to fetch from server. Using offline data.');
    }
  };

  const addContribution = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/contributions`, newContribution);
      setNewContribution({ memberId: '', eventId: '', amount: '', date: '', type: 'monthly' });
      fetchContributions();
      toast.success('Contribution added successfully!');
    } catch (error) {
      console.error('Error adding contribution:', error);

      if (error.response && error.response.data && error.response.data.errors) {
        const validationErrors = error.response.data.errors;
        for (const field in validationErrors) {
          toast.error(validationErrors[field]);
        }
      } else {
        toast.error('Failed to add contribution.');
      }
    }
  };

  const filteredContributions = contributions.filter((contribution) => {
    const typeFilter = filterType === 'all' ? true : contribution.type === filterType;
    const eventFilter = filterEventId === 'all' ? true : contribution.eventId === filterEventId;
    return typeFilter && eventFilter;
  });

  const sortedContributions = filteredContributions.sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(a.date) - new Date(b.date);
    } else if (sortBy === 'amount') {
      return a.amount - b.amount;
    }
    return 0;
  });

  const totalContributions = contributions.reduce(
    (total, contribution) => total + contribution.amount,
    0
  );

  // Format date as DD/MM/YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format currency as ETB
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount);
  };

  if (loading) {
    return <div className="contributions loading">Loading...</div>;
  }

  return (
    <div className="contributions">
      <h1>Contribution Tracking</h1>

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
        <h2>Record New Contribution</h2>
        <select
          value={newContribution.eventId}
          onChange={(e) => setNewContribution({ ...newContribution, eventId: e.target.value })}
        >
          <option value="">Select Event</option>
          {events.map((event) => (
            <option key={event._id} value={event._id}>
              {event.name} ({formatDate(event.date)})
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Member ID"
          value={newContribution.memberId}
          onChange={(e) =>
            setNewContribution({ ...newContribution, memberId: e.target.value })
          }
        />
        <input
          type="number"
          placeholder="Amount (ETB)"
          value={newContribution.amount}
          onChange={(e) =>
            setNewContribution({ ...newContribution, amount: e.target.value })
          }
        />
        <input
          type="date"
          value={newContribution.date}
          onChange={(e) =>
            setNewContribution({ ...newContribution, date: e.target.value })
          }
        />
        <select
          value={newContribution.type}
          onChange={(e) =>
            setNewContribution({ ...newContribution, type: e.target.value })
          }
        >

          <option value="">Select Type</option>
          {events.map((event) => (
            <option key={event._id} value={event.name}>
              {event.name} ({formatDate(event.date)})
            </option>
          ))}

          {/* <option value="monthly">Monthly</option>
          <option value="event">Event</option>
          <option value="other">Other</option> */}
        </select>
        <button onClick={addContribution} className="form-button">
          <FontAwesomeIcon icon={faPlus} /> Add Contribution
        </button>
      </motion.div>

      <div className="filter-sort">
        <label>
          <FontAwesomeIcon icon={faFilter} /> Filter by Type:
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All</option>
            <option value="monthly">Monthly</option>
            <option value="event">Event</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          Filter by Event:
          <select value={filterEventId} onChange={(e) => setFilterEventId(e.target.value)}>
            <option value="all">All</option>
            {events.map((event) => (
              <option key={event._id} value={event._id}>
                {event.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <FontAwesomeIcon icon={faSort} /> Sort by:
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Date</option>
            <option value="amount">Amount</option>
          </select>
        </label>
      </div>

      <div className="summary-card">
        <h3>Total Contributions</h3>
        <p>{formatCurrency(totalContributions)}</p>
      </div>

      <div className="contribution-list">
        <h2>Contributions</h2>
        {sortedContributions.length === 0 ? (
          <p>No contributions found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {sortedContributions.map((contribution) => (
                <tr key={contribution._id}>
                  <td>{contribution.memberId}</td>
                  <td>{formatCurrency(contribution.amount)}</td>
                  <td>{formatDate(contribution.date)}</td>
                  <td>{contribution.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default Contributions;