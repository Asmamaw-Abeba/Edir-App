// src/components/404.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Box } from '@mui/material';
import { styled } from '@mui/system';
import { motion } from 'framer-motion';

// Styled container for the 404 content
const NotFoundContainer = styled(Box)({
  textAlign: 'center',
  padding: '50px',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#f5f5f5',
});

// Animation variants
const fadeInVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <>
      <NotFoundContainer
        component={motion.div}
        initial="initial"
        animate="animate"
        variants={{
          initial: { opacity: 0 },
          animate: { opacity: 1, transition: { duration: 0.5 } },
        }}
      >
        <Typography
          variant="h1"
          component={motion.h1}
          variants={fadeInVariants}
          transition={{ duration: 0.5, delay: 0.2 }}
          sx={{
            fontSize: { xs: '48px', sm: '72px' }, // Responsive font size
            color: '#ff4444',
            fontWeight: 'bold',
            margin: 0,
          }}
        >
          {t('notfound.title')}
        </Typography>
        <Typography
          variant="h4"
          component={motion.h2}
          variants={fadeInVariants}
          transition={{ duration: 0.5, delay: 0.4 }}
          sx={{
            fontSize: { xs: '20px', sm: '24px' },
            color: '#333',
            margin: '10px 0 20px',
          }}
        >
          {t('notfound.subtitle')}
        </Typography>
        <Typography
          variant="body1"
          component={motion.p}
          variants={fadeInVariants}
          transition={{ duration: 0.5, delay: 0.6 }}
          sx={{
            fontSize: '18px',
            color: '#666',
            marginBottom: '30px',
            maxWidth: '400px',
          }}
        >
          {t('notfound.message')}
        </Typography>
        <Button
          component={motion.div}
          variants={fadeInVariants}
          transition={{ duration: 0.5, delay: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          sx={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: '#fff',
            textTransform: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: '#0056b3',
            },
          }}
        >
          <Link
            to="/"
            style={{
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            {t('notfound.go_back')}
          </Link>
        </Button>
      </NotFoundContainer>
    </>
  );
};

export default NotFound;