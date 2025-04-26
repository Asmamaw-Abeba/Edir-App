import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner,
  faMicrophone,
  faThumbsUp,
  faThumbsDown,
  faComment,
  faShare,
  faCheck,
  faReply,
  faChevronDown,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
import './css/FeedbackPage.css';

const getFileName = (filePath) => {
  if (!filePath) return '';
  const normalizedPath = filePath.replace(/\\/g, '/');
  const filename = normalizedPath.split('/').pop();
  return filename;
};

const FeedbackPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [feedbacks, setFeedbacks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('rating');
  const [commentInput, setCommentInput] = useState({});
  const [expandedReplies, setExpandedReplies] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        navigate('/login');
        return;
      }
      if (user?.role !== 'admin') {
        toast.error(t('feedback.forbidden'));
        navigate('/events');
        return;
      }
      fetchFeedbacks();
    }, 500);
    return () => clearTimeout(timer);
  }, [user, navigate, t]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      const eventsResponse = await api.get('/api/events');
      setEvents(eventsResponse.data);

      const feedbackPromises = eventsResponse.data.map(async (event) => {
        try {
          const feedbackResponse = await api.get(`/api/feedback/event/${event._id}`);
          return feedbackResponse.data;
        } catch (err) {
          console.warn(`Failed to fetch feedback for event ${event._id}:`, err);
          return [];
        }
      });

      const feedbackArrays = await Promise.all(feedbackPromises);
      const allFeedbacks = feedbackArrays.flat();
      setFeedbacks(allFeedbacks);
    } catch (err) {
      const errorMessage = err.response?.status === 401 ? t('feedback.unauthorized') : t('feedback.fetch_error');
      setError(errorMessage);
      toast.error(errorMessage);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const getEventName = (eventId) => {
    const id = typeof eventId === 'object' && eventId._id ? eventId._id : eventId;
    const event = events.find((e) => e._id === id);
    return typeof eventId === 'object' && eventId.name ? eventId.name : event ? event.name : 'Unknown Event';
  };

  const handleLike = async (feedbackId) => {
    try {
      const response = await api.put(`/api/feedback/${feedbackId}/like`);
      setFeedbacks((prev) =>
        prev.map((fb) => (fb._id === feedbackId ? { ...fb, likes: response.data.likes } : fb))
      );
      toast.success(t('feedback.liked'));
    } catch (err) {
      toast.error(t('feedback.action_error'));
    }
  };

  const handleDislike = async (feedbackId) => {
    try {
      const response = await api.put(`/api/feedback/${feedbackId}/dislike`);
      setFeedbacks((prev) =>
        prev.map((fb) => (fb._id === feedbackId ? { ...fb, dislikes: response.data.dislikes } : fb))
      );
      toast.success(t('feedback.disliked'));
    } catch (err) {
      toast.error(t('feedback.action_error'));
    }
  };

  const handleComment = async (feedbackId, parentCommentId = null) => {
    const key = parentCommentId ? `${feedbackId}-${parentCommentId}` : feedbackId;
    const text = commentInput[key];
    const id = user?.id;
    if (!text) return toast.error(t('feedback.comment_empty'));
    try {
      const response = await api.put(`/api/feedback/${feedbackId}/comment`, { id, text, parentCommentId });
      setFeedbacks((prev) =>
        prev.map((fb) => (fb._id === feedbackId ? { ...fb, comments: response.data } : fb))
      );
      setCommentInput((prev) => ({ ...prev, [key]: '' }));
      toast.success(t('feedback.commented'));
    } catch (err) {
      toast.error(t('feedback.action_error'));
    }
  };

  const handleShare = (feedbackId) => {
    const feedback = feedbacks.find((fb) => fb._id === feedbackId);
    const shareText = `${t('feedback.event')}: ${getEventName(feedback.eventId)}\n${t('feedback.member')}: ${feedback.memberId?.name || 'Unknown Member'}\n${t('feedback.text')}: ${feedback.text || t('feedback.no_text')}`;
    navigator.clipboard.writeText(shareText);
    toast.success(t('feedback.shared'));
  };

  const handleVerify = async (feedbackId) => {
    try {
      const response = await api.put(`/api/feedback/${feedbackId}/verify`);
      setFeedbacks((prev) =>
        prev.map((fb) =>
          fb._id === feedbackId ? { ...fb, memberId: { ...fb.memberId, verified: response.data.verified } } : fb
        )
      );
      toast.success(t('feedback.verified'));
    } catch (err) {
      toast.error(t('feedback.action_error'));
    }
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const renderComments = (comments, feedbackId, level = 0) => {
    return comments.map((comment, index) => (
      <div key={comment._id || index} className={`comment-item level-${level}`}>
        <div className="comment-content">
          <span className="comment-author">{comment.memberId?.name || 'Unknown'}</span>
          <p>{comment.text}</p>
          <div className="comment-meta">
            <span>{new Date(comment.date).toLocaleString()}</span>
            <button className="reply-button" onClick={() => toggleReplies(comment._id)}>
              <FontAwesomeIcon icon={expandedReplies[comment._id] ? faChevronUp : faChevronDown} />
              {t('feedback.reply')}
              {comment.replies?.length > 0 && ` (${comment.replies.length})`}
            </button>
          </div>
        </div>
        <div className="reply-input">
          <input
            type="text"
            value={commentInput[`${feedbackId}-${comment._id}`] || ''}
            onChange={(e) =>
              setCommentInput({
                ...commentInput,
                [`${feedbackId}-${comment._id}`]: e.target.value,
              })
            }
            placeholder={t('feedback.add_reply')}
          />
          <button onClick={() => handleComment(feedbackId, comment._id)} className="submit-reply">
            {t('feedback.submit_reply')}
          </button>
        </div>
        {comment.replies?.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: expandedReplies[comment._id] ? 'auto' : 0,
              opacity: expandedReplies[comment._id] ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
            className="replies-container"
          >
            {expandedReplies[comment._id] && renderComments(comment.replies, feedbackId, level + 1)}
          </motion.div>
        )}
      </div>
    ));
  };

  const groupedFeedbacks = feedbacks.reduce((acc, fb) => {
    const eventId = typeof fb.eventId === 'object' ? fb.eventId._id : fb.eventId;
    if (!acc[eventId]) acc[eventId] = [];
    acc[eventId].push(fb);
    return acc;
  }, {});

  const sortFeedbacks = (feedbacks) => {
    return [...feedbacks].sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
      return 0;
    });
  };

  if (loading) {
    return (
      <motion.div className="feedback-page loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <FontAwesomeIcon icon={faSpinner} spin size="3x" />
        <p>{t('feedback.loading')}</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div className="feedback-page error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <p>{error}</p>
        <button onClick={fetchFeedbacks} className="retry-button">{t('feedback.retry')}</button>
      </motion.div>
    );
  }

  return (
    <motion.div className="feedback-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h1>{t('feedback.title')}</h1>
      <div className="sort-controls">
        <label>{t('feedback.sort_by')}:</label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="rating">{t('feedback.rating')}</option>
          <option value="likes">{t('feedback.likes')}</option>
        </select>
      </div>
      {Object.keys(groupedFeedbacks).length === 0 ? (
        <p className="no-feedback">{t('feedback.no_feedback')}</p>
      ) : (
        <div className="event-feedback-container">
          {Object.entries(groupedFeedbacks).map(([eventId, eventFeedbacks]) => (
            <div key={eventId} className="event-section">
              <h2 className="event-title">{getEventName(eventId)}</h2>
              <div className="feedback-list">
                {sortFeedbacks(eventFeedbacks).map((fb) => {
                  const audioUrl = fb.audio ? `http://localhost:5000/api/feedback/audio/${getFileName(fb.audio)}` : null;
                  return (
                    <div key={fb._id} className="feedback-card">
                      <div className="feedback-header">
                        <span className="member-name">
                          {fb.memberId?.name || 'Unknown Member'}
                          {fb.memberId?.verified && (
                            <FontAwesomeIcon icon={faCheck} className="verified-icon" title="Verified" />
                          )}
                        </span>
                      </div>
                      <div className="feedback-content">
                        <p>{t('feedback.text')}: {fb.text || t('feedback.no_text')}</p>
                        <p>{t('feedback.rating')}: {fb.rating || 'N/A'}</p>
                        {fb.audio && (
                          <div className="audio-player">
                            <FontAwesomeIcon icon={faMicrophone} className="audio-icon" />
                            <audio controls>
                              <source src={audioUrl} type="audio/webm" />
                              {t('feedback.audio_unsupported')}
                            </audio>
                          </div>
                        )}
                        {fb.comments && fb.comments.length > 0 && (
                          <div className="comments-section">
                            <h4>{t('feedback.comments')}</h4>
                            {renderComments(fb.comments, fb._id)}
                          </div>
                        )}
                      </div>
                      <div className="feedback-actions">
                        <button className="action-btn like-btn" onClick={() => handleLike(fb._id)}>
                          <FontAwesomeIcon icon={faThumbsUp} /> {fb.likes || 0}
                        </button>
                        <button className="action-btn dislike-btn" onClick={() => handleDislike(fb._id)}>
                          <FontAwesomeIcon icon={faThumbsDown} /> {fb.dislikes || 0}
                        </button>
                        <input
                          type="text"
                          value={commentInput[fb._id] || ''}
                          onChange={(e) => setCommentInput({ ...commentInput, [fb._id]: e.target.value })}
                          placeholder={t('feedback.add_comment')}
                          className="comment-input"
                        />
                        <button className="action-btn comment-btn" onClick={() => handleComment(fb._id)}>
                          <FontAwesomeIcon icon={faComment} />
                        </button>
                        <button className="action-btn share-btn" onClick={() => handleShare(fb._id)}>
                          <FontAwesomeIcon icon={faShare} />
                        </button>
                        <button className="action-btn verify-btn" onClick={() => handleVerify(fb._id)}>
                          {fb.memberId?.verified ? 'Unverify' : 'Verify'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      <ToastContainer />
    </motion.div>
  );
};

export default FeedbackPage;