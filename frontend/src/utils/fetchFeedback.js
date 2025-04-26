import { useTranslation } from 'react-i18next';

// Helper function to extract filename from a path
const getFileName = (filePath) => filePath.split('/').pop();

export const renderFeedbackDisplay = (feedbacks, t) => (
  <div className="feedback-display">
    <h4>{t('events.feedback.title')} ({feedbacks.length})</h4>
    {feedbacks.length > 0 ? (
      feedbacks.map((fb) => (
        <div key={fb._id} className="feedback-item">
          <p>{fb.memberId.name}: {fb.text || 'No text'}</p>
          <p>{t('events.feedback.rating')}: {fb.rating || 'N/A'}</p>
          {fb.audio && (
            <audio controls>
              <source src={`https://edir-if1t.onrender.com/api/feedback/audio/${getFileName(fb.audio)}`} type="audio/webm" />
            </audio>
          )}
        </div>
      ))
    ) : (
      <p>{t('events.feedback.no_feedback')}</p>
    )}
  </div>
);