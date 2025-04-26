import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/Event.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faSpinner, faFilter, faSearch, faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { saveData, getData } from '../utils/offlineStorage';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from 'framer-motion';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Modal from 'react-modal';
import {
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Box,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import { useTranslation } from 'react-i18next'; // Add translation hook

Modal.setAppElement('#root');

const AdminEventPage = () => {
  const [events, setEvents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [editedEvent, setEditedEvent] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [filterContribution, setFilterContribution] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false); // Toggle form visibility
  const [newEvent, setNewEvent] = useState({
    name: '',
    date: '',
    description: '',
    requiresContribution: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const { t } = useTranslation(); // Add t function

  const API_BASE_URL = 'http://localhost:5000';

  useEffect(() => {
    fetchData();
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleOnline = () => {
    setIsOnline(true);
    syncLocalDataWithBackend();
  };

  const handleOffline = () => {
    setIsOnline(false);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [storedEvents, storedMembers, storedAttendance] = await Promise.all([
        getData('events'),
        getData('members'),
        getData('attendance'),
      ]);

      if (storedEvents) setEvents(storedEvents);
      if (storedMembers) setMembers(storedMembers);
      if (storedAttendance) setAttendance(storedAttendance);

      if (isOnline) {
        await Promise.all([fetchEvents(), fetchMembers(), fetchAttendance()]);
      }
    } catch (err) {
      setError(t('adminEvents.error'));
      toast.error(t('adminEvents.toast.load_error'));
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/events`);
      const eventsWithContributions = await Promise.all(
        response.data.map(async (event) => {
          const contributions = await axios.get(`${API_BASE_URL}/api/contributions?eventId=${event.name}`);
          return { ...event, contributions: contributions.data };
        })
      );
      setEvents(eventsWithContributions);
      await saveData('events', eventsWithContributions);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError(t('adminEvents.toast.events_error'));
      toast.error(t('adminEvents.toast.events_error'));
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/members`);
      setMembers(response.data);
      await saveData('members', response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
      setError(t('adminEvents.toast.members_error'));
      toast.error(t('adminEvents.toast.members_error'));
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/events`);
      await saveData('attendance', response.data.attendees || {});
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError(t('adminEvents.toast.attendance_error'));
      toast.error(t('adminEvents.toast.attendance_error'));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!newEvent.name.trim()) errors.name = t('adminEvents.form_errors.name_required');
    if (!newEvent.date) errors.date = t('adminEvents.form_errors.date_required');
    else if (new Date(newEvent.date) < new Date().setHours(0, 0, 0, 0)) errors.date = t('adminEvents.form_errors.date_past');
    if (!newEvent.description.trim()) errors.description = t('adminEvents.form_errors.description_required');
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewEvent({
      ...newEvent,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const addEvent = async () => {
    if (!validateForm()) return;

    const eventData = { ...newEvent, attendees: [] };
    try {
      if (isOnline) {
        const response = await axios.post(`${API_BASE_URL}/api/events`, eventData);
        setEvents([...events, response.data]);
        await saveData('events', [...events, response.data]);
        toast.success(t('adminEvents.toast.add_success'));
      } else {
        const offlineEvent = { ...eventData, _id: `offline_${Date.now()}` };
        setEvents([...events, offlineEvent]);
        await saveData('events', [...events, offlineEvent]);
        toast.info(t('adminEvents.toast.add_offline'));
      }
      setNewEvent({ name: '', date: '', description: '', requiresContribution: false });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding event:', error);
      setError(t('adminEvents.toast.add_error'));
      toast.error(t('adminEvents.toast.add_error'));
    }
  };

  const updateEvent = async () => {
    if (!editedEvent.name || !editedEvent.date) {
      toast.error(t('adminEvents.toast.update_required'));
      return;
    }
    try {
      const updatedEvents = events.map((event) =>
        event._id === editedEvent._id ? { ...event, ...editedEvent } : event
      );
      setEvents(updatedEvents);
      await saveData('events', updatedEvents);

      if (isOnline) {
        await axios.put(`${API_BASE_URL}/api/events/${editedEvent._id}`, editedEvent);
        toast.success(t('adminEvents.toast.update_success'));
      } else {
        toast.info(t('adminEvents.toast.update_offline'));
      }
      closeEditModal();
    } catch (error) {
      console.error('Error updating event:', error);
      setError(t('adminEvents.toast.update_error'));
      toast.error(t('adminEvents.toast.update_error'));
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm(t('adminEvents.delete_confirm'))) return;

    try {
      const updatedEvents = events.filter((event) => event._id !== eventId);
      setEvents(updatedEvents);
      await saveData('events', updatedEvents);

      if (isOnline) {
        await axios.delete(`${API_BASE_URL}/api/events/${eventId}`);
        toast.success(t('adminEvents.toast.delete_success'));
      } else {
        toast.info(t('adminEvents.toast.delete_offline'));
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setError(t('adminEvents.toast.delete_error'));
      toast.error(t('adminEvents.toast.delete_error'));
    }
  };

  const toggleAttendance = async (eventId, memberId) => {
    try {
      const updatedAttendance = { ...attendance };
      if (!updatedAttendance[eventId]) updatedAttendance[eventId] = [];
      const eventIndex = events.findIndex((e) => e._id === eventId);
      const updatedEvents = [...events];
      const event = { ...updatedEvents[eventIndex] };

      if (!event.attendees) event.attendees = [];

      if (event.attendees.includes(memberId)) {
        event.attendees = event.attendees.filter((id) => id !== memberId);
        updatedAttendance[eventId] = updatedAttendance[eventId].filter((id) => id !== memberId);
      } else {
        event.attendees.push(memberId);
        updatedAttendance[eventId].push(memberId);
      }

      updatedEvents[eventIndex] = event;
      setEvents(updatedEvents);
      setAttendance(updatedAttendance);
      await saveData('attendance', updatedAttendance);

      if (isOnline) {
        await axios.put(`${API_BASE_URL}/api/events/${eventId}/attendance`, { memberId });
        toast.success(t('adminEvents.toast.attendance_success'));
      } else {
        toast.info(t('adminEvents.toast.attendance_offline'));
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      setError(t('adminEvents.toast.attendance_error'));
      toast.error(t('adminEvents.toast.attendance_error'));
    }
  };

  const syncLocalDataWithBackend = async () => {
    try {
      const localAttendance = await getData('attendance');
      const localEvents = await getData('events');

      if (localAttendance) {
        for (const eventId in localAttendance) {
          for (const memberId of localAttendance[eventId]) {
            await axios.put(`${API_BASE_URL}/api/events/${eventId}/attendance`, { memberId });
          }
        }
        await saveData('attendance', {});
      }

      if (localEvents) {
        const serverEvents = (await axios.get(`${API_BASE_URL}/api/events`)).data;

        for (const localEvent of localEvents) {
          const serverEvent = serverEvents.find((se) => se._id === localEvent._id);
          if (!serverEvent) {
            await axios.post(`${API_BASE_URL}/api/events`, localEvent);
          } else if (JSON.stringify(serverEvent) !== JSON.stringify(localEvent)) {
            await axios.put(`${API_BASE_URL}/api/events/${localEvent._id}`, localEvent);
          }
        }

        for (const serverEvent of serverEvents) {
          if (!localEvents.find((le) => le._id === serverEvent._id)) {
            await axios.delete(`${API_BASE_URL}/api/events/${serverEvent._id}`);
          }
        }

        await saveData('events', serverEvents);
        toast.success(t('adminEvents.toast.sync_success'));
      }
    } catch (error) {
      console.error('Error syncing local data:', error);
      toast.error(t('adminEvents.toast.sync_error'));
    }
  };

  const openModal = (eventId) => {
    setSelectedEventId(eventId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEventId(null);
  };

  const openEditModal = (eventId) => {
    const eventToEdit = events.find((event) => event._id === eventId);
    setEditedEvent({ ...eventToEdit });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditedEvent(null);
  };

  const filterAndSearchEvents = (eventList) => {
    return eventList.filter((event) => {
      const matchesContribution =
        filterContribution === 'all' ||
        (filterContribution === 'yes' && event.requiresContribution) ||
        (filterContribution === 'no' && !event.requiresContribution);
      const matchesSearch =
        searchQuery === '' ||
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesContribution && matchesSearch;
    });
  };

  const now = new Date();
  const upcomingEvents = filterAndSearchEvents(events.filter((event) => new Date(event.date) >= now));
  const pastEvents = filterAndSearchEvents(events.filter((event) => new Date(event.date) < now));

  const renderEventCard = (event) => {
    const isPastEvent = new Date(event.date) < now;

    return (
      <motion.div
        key={event._id}
        className="event-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="event-card-header">
          <h3>{event.name}</h3>
          <div className="event-actions">
            <button
              className="edit-button"
              onClick={() => openEditModal(event._id)}
              aria-label={t('adminEvents.edit_event') + ` ${event.name}`}
              data-tooltip={t('adminEvents.edit_event')}
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button
              className="delete-button"
              onClick={() => deleteEvent(event._id)}
              aria-label={t('adminEvents.delete_confirm') + ` ${event.name}`}
              data-tooltip={t('adminEvents.delete_confirm')}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </div>
        <p>
          <FontAwesomeIcon icon={faCalendarAlt} className="event-icon" />
          {new Date(event.date).toLocaleDateString()}
        </p>
        <p className="event-description">{t('adminEvents.reason')} {event.description}</p>
        <p>{t('adminEvents.attendees')} {event.attendees?.length || 0}</p>
        <p>{t('adminEvents.requires_contribution')}: {event.requiresContribution ? t('filter_yes') : t('filter_no')}</p>
        <div className="attendance-section">
          <h4>{t('adminEvents.attendance')}</h4>
          <div className="member-list">
            {members.map((member) => (
              <div key={member._id} className="member-list-item">
                <span>
                  <AccountCircleIcon className="user-photo" fontSize="large" /> {member.name}
                </span>
                <label className="attendance-checkbox">
                  <input
                    type="checkbox"
                    checked={event.attendees?.includes(member._id) || false}
                    onChange={() => toggleAttendance(event._id, member._id)}
                    disabled={isPastEvent}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
        <button
          className="view-attendees-button"
          onClick={() => openModal(event._id)}
          aria-label={t('adminEvents.view_attendees') + ` ${event.name}`}
        >
          {t('adminEvents.view_attendees')} ({event.attendees?.length || 0})
        </button>
        <div className="contributions">
          <h4>{t('adminEvents.contributions')}</h4>
          {event.contributions?.length > 0 ? (
            <div className="contributions-list">
              {event.contributions.map((contribution) => (
                <div key={contribution._id} className="contribution-item">
                  <p>{contribution.memberId}: {contribution.amount} ETB</p>
                  <p>{contribution.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>{t('adminEvents.no_contributions')}</p>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <motion.div className="events loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <CircularProgress size={60} />
        <p>{t('adminEvents.loading')}</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div className="events error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        {error}
      </motion.div>
    );
  }

  return (
    <motion.div className="events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h1>{t('adminEvents.title')}</h1>
      <Button
        variant="contained"
        color="primary"
        startIcon={<FontAwesomeIcon icon={faPlus} />}
        onClick={() => setShowForm(!showForm)}
        sx={{ mb: 2 }}
      >
        {showForm ? t('adminEvents.hide_form') : t('adminEvents.add_event')}
      </Button>

      {showForm && (
        <Box component="form" sx={{ mb: 4, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('adminEvents.create_new_event')}
          </Typography>
          <TextField
            fullWidth
            label={t('adminEvents.event_name_label')}
            name="name"
            value={newEvent.name}
            onChange={handleInputChange}
            error={!!formErrors.name}
            helperText={formErrors.name}
            margin="normal"
            variant="outlined"
          />
          <TextField
            fullWidth
            label={t('adminEvents.event_date_label')}
            name="date"
            type="date"
            value={newEvent.date}
            onChange={handleInputChange}
            error={!!formErrors.date}
            helperText={formErrors.date}
            margin="normal"
            variant="outlined"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label={t('adminEvents.description_label')}
            name="description"
            value={newEvent.description}
            onChange={handleInputChange}
            error={!!formErrors.description}
            helperText={formErrors.description}
            margin="normal"
            variant="outlined"
            multiline
            rows={3}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={newEvent.requiresContribution}
                onChange={handleInputChange}
                name="requiresContribution"
                color="primary"
              />
            }
            label={t('adminEvents.requires_contribution')}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={addEvent}
            sx={{ mt: 2 }}
          >
            {t('adminEvents.add_event')}
          </Button>
        </Box>
      )}

      <div className="filter-search">
        <FormControl sx={{ minWidth: 200, mr: 2 }}>
          <InputLabel>
            <FontAwesomeIcon icon={faFilter} /> {t('adminEvents.filter_by_contribution')}
          </InputLabel>
          <Select
            value={filterContribution}
            onChange={(e) => setFilterContribution(e.target.value)}
            label={t('adminEvents.filter_by_contribution')}
          >
            <MenuItem value="all">{t('adminEvents.filter_all')}</MenuItem>
            <MenuItem value="yes">{t('adminEvents.filter_yes')}</MenuItem>
            <MenuItem value="no">{t('adminEvents.filter_no')}</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label={t('adminEvents.search_label')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <FontAwesomeIcon icon={faSearch} style={{ marginRight: 8 }} />,
          }}
          variant="outlined"
          sx={{ minWidth: 300 }}
        />
      </div>

      <div className="event-list">
        <h2>{t('adminEvents.upcoming_events')}</h2>
        {upcomingEvents.length === 0 ? <p>{t('adminEvents.no_upcoming_events')}</p> : <AnimatePresence>{upcomingEvents.map(renderEventCard)}</AnimatePresence>}
      </div>

      <div className="event-list">
        <h2>{t('adminEvents.past_events')}</h2>
        {pastEvents.length === 0 ? <p>{t('adminEvents.no_past_events')}</p> : <AnimatePresence>{pastEvents.map(renderEventCard)}</AnimatePresence>}
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel={t('adminEvents.attendees_modal')}
        className="modal"
        overlayClassName="modal-overlay"
      >
        <h2>{t('adminEvents.attendees_modal')}</h2>
        <ul>
          {selectedEventId && events.find((event) => event._id === selectedEventId)?.attendees?.length > 0 ? (
            events
              .find((event) => event._id === selectedEventId)
              .attendees.map((memberId) => {
                const member = members.find((m) => m._id === memberId);
                return <li key={memberId}>{member?.name || `Unknown Member (ID: ${memberId})`}</li>;
              })
          ) : (
            <li>{t('adminEvents.no_attendees')}</li>
          )}
        </ul>
        <button onClick={closeModal} className="close-modal-button" aria-label={t('adminEvents.close')}>
          {t('adminEvents.close')}
        </button>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={closeEditModal}
        contentLabel={t('adminEvents.edit_event')}
        className="modal edit-modal"
        overlayClassName="modal-overlay"
      >
        <h2>{t('adminEvents.edit_event')}</h2>
        {editedEvent && (
          <Box component="form" sx={{ p: 2 }}>
            <TextField
              fullWidth
              label={t('adminEvents.event_name_label')}
              value={editedEvent.name}
              onChange={(e) => setEditedEvent({ ...editedEvent, name: e.target.value })}
              margin="normal"
              variant="outlined"
            />
            <TextField
              fullWidth
              label={t('adminEvents.event_date_label')}
              type="date"
              value={editedEvent.date.split('T')[0]}
              onChange={(e) => setEditedEvent({ ...editedEvent, date: e.target.value })}
              margin="normal"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label={t('adminEvents.description_label')}
              value={editedEvent.description}
              onChange={(e) => setEditedEvent({ ...editedEvent, description: e.target.value })}
              margin="normal"
              variant="outlined"
              multiline
              rows={3}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={editedEvent.requiresContribution}
                  onChange={(e) => setEditedEvent({ ...editedEvent, requiresContribution: e.target.checked })}
                  color="primary"
                />
              }
              label={t('adminEvents.requires_contribution')}
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button variant="contained" color="primary" onClick={updateEvent}>
                {t('adminEvents.save_changes')}
              </Button>
              <Button variant="outlined" onClick={closeEditModal}>
                {t('adminEvents.cancel')}
              </Button>
            </Box>
          </Box>
        )}
      </Modal>

      <ToastContainer />
    </motion.div>
  );
};

export default AdminEventPage;