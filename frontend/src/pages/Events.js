import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './css/Events.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faSpinner,
  faInfoCircle,
  faMoneyBillWave,
  faMicrophone,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import { getData, saveData } from '../utils/offlineStorage';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from 'react-modal';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';

Modal.setAppElement('#root');

const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const [events, setEvents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [recordingEventId, setRecordingEventId] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [feedbackText, setFeedbackText] = useState({});
  const [ratings, setRatings] = useState({});

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
    fetchData();
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

      if (isOnline) {
        await Promise.all([fetchEvents(), fetchMembers(), fetchAttendance()]);
      }
    } catch (err) {
      setError(t('events.error'));
      toast.error(t('events.toast.load_error'));
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await api.get(`/api/events`);
      setAttendance(response.data.attendees || []);
      const eventsWithContributions = await Promise.all(
        response.data.map(async (event) => {
          const contributions = await api.get(`/api/contributions?eventId=${event.name}`);
          return { ...event, contributions: contributions.data };
        })
      );
      setEvents(eventsWithContributions);
      await saveData('events', eventsWithContributions);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError(t('events.error'));
      toast.error(t('events.toast.events_error'));
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/api/members`);
      setMembers(response.data);
      await saveData('members', response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
      setError(t('events.error'));
      toast.error(t('events.toast.members_error'));
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await api.get(`/api/events`);
      await saveData('attendance', response.data.attendees || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError(t('events.error'));
      toast.error(t('events.toast.attendance_error'));
    }
  };

  const startRecording = async (eventId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (e) => audioChunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecordingEventId(eventId);
    } catch (error) {
      toast.error(t('events.feedback.audio_error'));
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setMediaRecorder(null);
      setRecordingEventId(null);
    }
  };

  const submitFeedback = async (eventId) => {
    console.log('Submitting feedback with memberId:', user.id); // Add this
    const formData = new FormData();
    if (audioBlob) formData.append('audio', audioBlob, `feedback-${eventId}.webm`);
    if (feedbackText[eventId]) formData.append('text', feedbackText[eventId]);
    if (ratings[eventId]) formData.append('rating', ratings[eventId]);
    formData.append('eventId', eventId);
    formData.append('memberId', user.id);
  
    try {
      if (isOnline) {
        const response = await api.post('/api/feedback', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success(t('events.feedback.success'));
      } else {
        await saveData(`feedback-${eventId}`, Object.fromEntries(formData));
        toast.info(t('events.feedback.offline'));
      }
      setAudioBlob(null);
      setFeedbackText((prev) => ({ ...prev, [eventId]: '' }));
      setRatings((prev) => ({ ...prev, [eventId]: 0 }));
    } catch (error) {
      console.error('Error submitting feedback:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(`${t('events.feedback.error')}: ${error.response?.data?.message || error.message}`);
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

  const now = new Date();
  const upcomingEvents = events.filter((event) => new Date(event.date) >= now);
  const pastEvents = events.filter((event) => new Date(event.date) < now);

  const renderEventCard = (event) => (
    <motion.div
      key={event._id}
      className="event-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h3>{event.name}</h3>
      <p>
        <FontAwesomeIcon icon={faCalendarAlt} className="event-icon" />
        {new Date(event.date).toLocaleDateString()}
      </p>
      <p className="event-description">
        {t('events.reason_label')}: {event.description}
      </p>
      <p>{t('events.attendees_label')}: {event.attendees?.length || 0}</p>
      <p>
        {t('events.requires_contribution_label')}: {event.requiresContribution ? t('events.yes') : t('events.no')}
      </p>
      <div className="event-actions">
        <button className="view-attendees-button" onClick={() => openModal(event._id)}>
          {t('events.view_attendees_button')} ({event.attendees?.length || 0})
        </button>
        {upcomingEvents.some((e) => e._id === event._id) && event.requiresContribution && (
          <Link
            to={`/contributions?e_id=${event._id}`}
            state={{ eventName: event.name }}
            className="contribute-button"
          >
            <FontAwesomeIcon icon={faMoneyBillWave} /> {t('events.contribute_button')}
          </Link>
        )}
      </div>
      <div className="contributions">
        <h4>
          {t('events.contributions_title')} ({event.contributions?.length || '0'} {t('events.contributors_suffix')})
        </h4>
        {event.contributions?.length > 0 ? (
          <div className="contributions-list">
            {event.contributions.map((contribution) => (
              <div key={contribution._id} className="contribution-item">
                <p>
                  {members.find((m) => m.name === contribution.memberId)?.name || 'Unknown Member'}: {contribution.amount} ETB
                </p>
                <p>{t('events.type_label')}: {contribution.type}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>{t('events.no_contributions')}</p>
        )}
      </div>
      {/* Feedback Section */}
      <div className="feedback-section">
        <h4>{t('events.feedback.title')}</h4>
        <div className="audio-feedback">
          <button
            onClick={() => (recordingEventId === event._id ? stopRecording() : startRecording(event._id))}
            className={`record-button ${recordingEventId === event._id ? 'recording' : ''}`}
          >
            <FontAwesomeIcon icon={faMicrophone} />
            {recordingEventId === event._id ? t('events.feedback.stop_recording') : t('events.feedback.record')}
          </button>
        </div>
        <textarea
          placeholder={t('events.feedback.text_placeholder')}
          value={feedbackText[event._id] || ''}
          onChange={(e) => setFeedbackText((prev) => ({ ...prev, [event._id]: e.target.value }))}
          className="feedback-textarea"
        />
        <div className="rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <FontAwesomeIcon
              key={star}
              icon={faStar}
              className={`star ${ratings[event._id] >= star ? 'filled' : ''}`}
              onClick={() => setRatings((prev) => ({ ...prev, [event._id]: star }))}
            />
          ))}
        </div>
        <button
          onClick={() => submitFeedback(event._id)}
          className="submit-feedback-button"
          disabled={!audioBlob && !feedbackText[event._id] && !ratings[event._id]}
        >
          {t('events.feedback.submit')}
        </button>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <motion.div className="events loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <FontAwesomeIcon icon={faSpinner} spin size="3x" />
        <p>{t('events.loading')}</p>
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
      <h1>{t('events.title')}</h1>
      <div className="event-list">
        <h2>{t('events.upcoming_events')}</h2>
        {upcomingEvents.length === 0 ? (
          <p>{t('events.no_upcoming_events')}</p>
        ) : (
          <AnimatePresence>{upcomingEvents.map(renderEventCard)}</AnimatePresence>
        )}
      </div>
      <div className="event-list">
        <h2>{t('events.past_events')}</h2>
        {pastEvents.length === 0 ? (
          <p>{t('events.no_past_events')}</p>
        ) : (
          <AnimatePresence>{pastEvents.map(renderEventCard)}</AnimatePresence>
        )}
      </div>
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel={t('events.modal_title')}
        className="modal"
        overlayClassName="modal-overlay"
      >
        <h2>{t('events.modal_title')}</h2>
        {selectedEventId && (
          <ul>
            {events
              .filter((event) => event._id === selectedEventId)
              .map((event) =>
                event.attendees?.length > 0 ? (
                  event.attendees.map((memberId) => {
                    const member = members.find((m) => m._id === memberId);
                    return <li key={memberId}>{member?.name || `Unknown Member (ID: ${memberId})`}</li>;
                  })
                ) : (
                  <li>{t('events.no_attendees')}</li>
                )
              )}
          </ul>
        )}
        <button onClick={closeModal} className="close-modal-button">
          {t('events.close_button')}
        </button>
      </Modal>
      <ToastContainer />
    </motion.div>
  );
};

export default Events;