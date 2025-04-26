// src/pages/Privacy.js
import React from 'react';
import './css/Privacy.css';
import { motion } from 'framer-motion'; // For animations
import { Helmet } from 'react-helmet'; // For SEO
import { jsPDF } from 'jspdf';
import { useTranslation } from 'react-i18next';

// Reusable PrivacySection component
const PrivacySection = ({ title, content }) => (
  <motion.div
    className="privacy-section"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <h2>{title}</h2>
    <p>{content}</p>
  </motion.div>
);

const Privacy = () => {
  const { t } = useTranslation();

  // Fetch privacy data from translations
  const privacyData = t('privacy.sections', { returnObjects: true });

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text(t('privacy.title'), 10, 10); // Localized title
    privacyData.forEach((section, index) => {
      doc.text(section.title, 10, 20 + index * 30); // Increased spacing for readability
      doc.text(section.content, 10, 30 + index * 30, { maxWidth: 180 }); // Wrap text
    });
    doc.text(`${t('privacy.last_updated_label')}: ${t('privacy.last_updated')}`, 10, 20 + privacyData.length * 30);
    doc.text(t('privacy.contact_prompt'), 10, 30 + privacyData.length * 30);
    doc.save('Privacy_Policy_Edir_Connect.pdf');
  };

  return (
    <div className="privacy" role="main" aria-label={t('privacy.title')}>
      <Helmet>
        <title>{t('privacy.meta_title')}</title>
        <meta name="description" content={t('privacy.meta_description')} />
      </Helmet>

      {/* Hero Section */}
      <section className="privacy-hero">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {t('privacy.title')}
        </motion.h1>
        <p>{t('privacy.subtitle')}</p>
      </section>

      {/* Privacy Content */}
      <section className="privacy-content">
        {privacyData.map((section, index) => (
          <PrivacySection
            key={index}
            title={section.title}
            content={section.content}
          />
        ))}
        <div className="additional-info">
          <p>
            <strong>{t('privacy.last_updated_label')}:</strong> {t('privacy.last_updated')}
          </p>
          <p>
            {t('privacy.contact_prompt')}{' '}
            <a href={`mailto:${t('privacy.contact_email')}`}>{t('privacy.contact_link')}</a>
          </p>
          <motion.button
            onClick={downloadPDF}
            className="download-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t('privacy.download_button')}
          </motion.button>
        </div>
      </section>
    </div>
  );
};

export default Privacy;