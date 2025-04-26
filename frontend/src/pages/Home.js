// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CountUp from 'react-countup';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { features, fetchTestimonials } from '../data';
import './css/Home.css';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { t, i18n } = useTranslation();
  const [testimonials, setTestimonials] = useState([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalContributions, setTotalContributions] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const testimonialsPerPage = 3;

  const API_BASE_URL = 'https://edir-if1t.onrender.com';

  const fetchImpactData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsResponse, contributionsResponse, membersResponse] = await Promise.all([
        api.get(`/api/events`),
        api.get(`/api/contributions`),
        api.get(`/api/members`),
      ]);

      setTotalEvents(eventsResponse.data.length);
      setTotalContributions(
        contributionsResponse.data.reduce((sum, contribution) => sum + contribution.amount, 0)
      );
      setTotalMembers(membersResponse.data.length);
    } catch (err) {
      setError(t('home.error_testimonials', { message: 'Failed to load dashboard data.' }));
      toast.error(t('home.error_testimonials', { message: 'Failed to load dashboard data.' }));
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        fetchImpactData();
        const data = await fetchTestimonials();
        setTestimonials(data);
        setLoading(false);
      } catch (err) {
        setError(t('home.error_testimonials', { message: err.message }));
        setLoading(false);
      }
    };
    loadTestimonials();
  }, [t]);

  // Fetch features from translations
  const features = t('features.list', { returnObjects: true });

  const indexOfLastTestimonial = currentPage * testimonialsPerPage;
  const indexOfFirstTestimonial = indexOfLastTestimonial - testimonialsPerPage;
  const currentTestimonials = testimonials.slice(indexOfFirstTestimonial, indexOfLastTestimonial);
  const totalPages = Math.ceil(testimonials.length / testimonialsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const pageVariants = { initial: { opacity: 0 }, in: { opacity: 1 }, out: { opacity: 0 } };
  const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5 };
  const sectionVariants = { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } };
  const sectionTransition = { type: 'spring', damping: 25, stiffness: 120 };

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  const carouselItems = [
    { id: 1, type: 'image', src: '/images/event1.avif', alt: 'Community Event 1' },
    { id: 2, type: 'image', src: '/images/event2.avif', alt: 'Community Event 2' },
    { id: 3, type: 'video', src: '/images/demo.mp4', alt: 'App Demo Video' },
  ];

  const stats = [
    { id: 1, title: t('home.users'), value: totalMembers || 0 },
    { id: 2, title: t('home.events_managed'), value: totalEvents || 0 },
    { id: 3, title: t('home.contributions'), value: totalContributions || 0 },
  ];

  return (
    <motion.div
      className="home"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      {/* <div className="language-switcher">
        <button onClick={() => changeLanguage('en')}>English</button>
        <button onClick={() => changeLanguage('am')}>አማርኛ</button>
      </div> */}

      <motion.section
        className="hero"
        initial="hidden"
        animate="visible"
        transition={{ ...sectionTransition, delay: 0.2 }}
        variants={sectionVariants}
      >
        <div className="hero-content">
          <h1>{t('home.welcome')}</h1>
          <p>{t('home.hero_description')}</p>
          <Link to="/register" className="cta-button">
            {t('home.join_us')}
          </Link>
        </div>
      </motion.section>

      <motion.section
        className="carousel"
        initial="hidden"
        animate="visible"
        transition={{ ...sectionTransition, delay: 0.8 }}
        variants={sectionVariants}
      >
        <h2>{t('home.community_events')}</h2>
        <Slider {...carouselSettings}>
          {carouselItems.map((item) => (
            <div key={item.id} className="carousel-item">
              {item.type === 'image' ? (
                <img src={item.src} alt={item.alt} />
              ) : (
                <video controls>
                  <source src={item.src} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          ))}
        </Slider>
      </motion.section>

      <motion.section
        className="statistics"
        initial="hidden"
        animate="visible"
        transition={{ ...sectionTransition, delay: 1 }}
        variants={sectionVariants}
      >
        <h2>{t('home.our_impact')}</h2>
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.id} className="stat-item">
              <CountUp start={0} end={stat.value} duration={2.5} separator="," className="stat-value" />
              <p className="stat-title">{stat.title}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="features"
        initial="hidden"
        animate="visible"
        transition={{ ...sectionTransition, delay: 0.4 }}
        variants={sectionVariants}
      >
        <h2>{t('home.why_choose')}</h2>
        <div className="feature-cards">
          <AnimatePresence>
            {features.map((feature) => (
              <motion.div
                className="card"
                key={feature.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.section>

      <motion.section
        className="testimonials"
        initial="hidden"
        animate="visible"
        transition={{ ...sectionTransition, delay: 0.6 }}
        variants={sectionVariants}
      >
        <h2>{t('home.what_users_say')}</h2>
        {loading ? (
          <p>{t('home.loading_testimonials')}</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <>
            <div className="testimonial-cards">
              <AnimatePresence>
                {currentTestimonials.map((testimonial) => (
                  <motion.div
                    className="testimonial"
                    key={testimonial.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="testimonial-header">
                      <AccountCircleIcon className="user-photo" fontSize="large" />
                      <p className="author">{testimonial.author}</p>
                    </div>
                    <p className="testimonial-text">{testimonial.text}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="pagination">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                {t('home.previous')}
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageClick(page)}
                  className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                {t('home.next')}
              </button>
            </div>
          </>
        )}
      </motion.section>

      <footer className="footer">
        <div className="footer-links">
          <Link to="/about">{t('home.about_us')}</Link>
          <Link to="/contact">{t('home.contact')}</Link>
          <Link to="/privacy">{t('home.privacy_policy')}</Link>
        </div>
        <div className="social-media">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            Twitter
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        </div>
        <p>{t('home.footer_rights')}</p>
      </footer>
    </motion.div>
  );
};

export default Home;