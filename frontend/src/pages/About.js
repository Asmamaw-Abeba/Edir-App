// src/pages/About.js
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './css/About.css';
import { motion } from 'framer-motion'; // For animations
import { useTranslation } from 'react-i18next'; // Add translation hook

// Reusable TeamMember component
const TeamMember = ({ name, role, onClick }) => (
  <motion.div
    className="member"
    whileHover={{ scale: 1.05 }}
    transition={{ duration: 0.3 }}
    onClick={onClick} // Add onClick handler
    style={{ cursor: onClick ? 'pointer' : 'default' }} // Visual feedback for clickable members
  >
    <h3>{name}</h3>
    <p>{role}</p>
  </motion.div>
);

const About = () => {
  const { t } = useTranslation();

  // Fetch team members from translations
  const teamMembers = t('about.team_members', { returnObjects: true });

  return (
    <div className="about" role="main" aria-label={t('about.hero_title')}>
      {/* Hero Section */}
      <section className="about-hero">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {t('about.hero_title')}
        </motion.h1>
        <p>{t('about.hero_description')}</p>
        <motion.button
          className="cta-button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {t('about.hero_button')}
        </motion.button>
      </section>

      {/* Mission Section */}
      <section className="mission">
        <h2>{t('about.mission_title')}</h2>
        <p>{t('about.mission_description')}</p>
      </section>

      {/* Team Section */}
      <section className="team">
        <h2>{t('about.team_title')}</h2>
        <div className="team-members">
          {teamMembers.map((member, index) => (
            <TeamMember
              key={index}
              name={member.name}
              role={member.role}
              onClick={
                index < 2
                  ? () => {
                      console.log('Navigating to external URL for:', member.name); // Debug log
                      window.location.href = 'https://asmamaw.onrender.com/';
                    }
                  : null
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default About;