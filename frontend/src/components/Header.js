// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom'; // Change from Link to NavLink
import { styled } from '@mui/system';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { motion } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';

// Styled Components for Custom Styling
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#282c34',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
}));

const StyledToolbar = styled(Toolbar)({
  display: 'flex',
  justifyContent: 'space-between',
});

const NavLink = styled(Link)(({ theme }) => ({
  color: 'white',
  textDecoration: 'none',
  margin: theme.spacing(0, 2),
  '&:hover': {
    textDecoration: 'underline',
  },
}));

const MenuButton = styled(IconButton)(({ theme }) => ({
  color: 'white',
  [theme.breakpoints.up('sm')]: {
    display: 'none',
  },
}));

const NavLinksContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));
const Header = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
  ];

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
  };

  const handleLanguageMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nLng', lng);
    handleLanguageMenuClose();
  };

  const homePath = user && user.role === 'admin' ? '/admin/dashboard' : '/';

  return (
    <StyledAppBar position="static">
      <StyledToolbar>
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <NavLink to="/" aria-label={t('header.app_title')}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {t('header.app_title')}
            </Typography>
          </NavLink>
        </motion.div>

        <NavLinksContainer>
          <NavLink
            to={homePath}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            {t('header.home')}
          </NavLink>
          {!user ? (
            <></>
          ) : (
            <>
              {user.role === 'member' ? (
                <></>
              ) : (
                <>
                  <NavLink
                    to="/members"
                    className={({ isActive }) => (isActive ? 'active' : '')}
                  >
                    {t('header.members')}
                  </NavLink>
                  <NavLink
                    to="/contributions"
                    className={({ isActive }) => (isActive ? 'active' : '')}
                  >
                    {t('header.contributions')}
                  </NavLink>
                </>
              )}
              <NavLink
                to="/events"
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {t('header.events')}
              </NavLink>
            </>
          )}
          <NavLink
            to="/about"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            {t('header.about')}
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            {t('header.contact')}
          </NavLink>

          {user ? (
            <>
              <Typography variant="body1" sx={{ color: 'white', marginRight: 2 }}>
                {user.name}
              </Typography>
              <IconButton color="inherit" onClick={handleLogout} aria-label={t('header.logout')}>
                <LogoutIcon />
              </IconButton>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {t('header.login')}
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {t('header.register')}
              </NavLink>
            </>
          )}

          {/* Language Switcher */}
          <Box>
            <Button
              color="inherit"
              onClick={handleLanguageMenuOpen}
              endIcon={<ArrowDropDownIcon />}
              sx={{
                textTransform: 'none',
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              }}
            >
              <Typography variant="body1" sx={{ mr: 1 }}>
                {currentLanguage.flag} {currentLanguage.name}
              </Typography>
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleLanguageMenuClose}
              PaperProps={{
                sx: {
                  backgroundColor: '#282c34',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                },
              }}
            >
              {languages.map((lang) => (
                <MenuItem
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  selected={lang.code === i18n.language}
                  sx={{
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: '#4a90e2',
                    },
                  }}
                >
                  <Typography variant="body1">
                    {lang.flag} {lang.name}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </NavLinksContainer>

        <MenuButton onClick={handleDrawerToggle}>
          <MenuIcon />
        </MenuButton>

        {/* Mobile Menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              top: '64px',
              left: 0,
              width: '100%',
              backgroundColor: '#282c34',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 10,
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            }}
          >
            <NavLink
              to={homePath}
              onClick={handleDrawerToggle}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {t('header.home')}
            </NavLink>
            {user && user.role !== 'member' && (
              <>
                <NavLink
                  to="/members"
                  onClick={handleDrawerToggle}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  {t('header.members')}
                </NavLink>
                <NavLink
                  to="/contributions"
                  onClick={handleDrawerToggle}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  {t('header.contributions')}
                </NavLink>
              </>
            )}
            <NavLink
              to="/events"
              onClick={handleDrawerToggle}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {t('header.events')}
            </NavLink>
            <NavLink
              to="/about"
              onClick={handleDrawerToggle}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {t('header.about')}
            </NavLink>
            <NavLink
              to="/contact"
              onClick={handleDrawerToggle}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {t('header.contact')}
            </NavLink>
            {user ? (
              <>
                <Typography variant="body1" sx={{ color: 'white', padding: '8px 0' }}>
                  {user.name}
                </Typography>
                <Button
                  color="inherit"
                  onClick={handleLogout}
                  startIcon={<LogoutIcon />}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  {t('header.logout')}
                </Button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  onClick={handleDrawerToggle}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  {t('header.login')}
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={handleDrawerToggle}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  {t('header.register')}
                </NavLink>
              </>
            )}
            {/* Language Switcher in Mobile Menu */}
            <Box sx={{ padding: '8px 0' }}>
              <Button
                color="inherit"
                onClick={handleLanguageMenuOpen}
                endIcon={<ArrowDropDownIcon />}
                sx={{
                  textTransform: 'none',
                  color: 'white',
                  justifyContent: 'flex-start',
                  width: '100%',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                }}
              >
                <Typography variant="body1" sx={{ mr: 1 }}>
                  {currentLanguage.flag} {currentLanguage.name}
                </Typography>
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleLanguageMenuClose}
                PaperProps={{
                  sx: {
                    backgroundColor: '#282c34',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  },
                }}
              >
                {languages.map((lang) => (
                  <MenuItem
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    selected={lang.code === i18n.language}
                    sx={{
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: '#4a90e2',
                      },
                    }}
                  >
                    <Typography variant="body1">
                      {lang.flag} {lang.name}
                    </Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </motion.div>
        )}
      </StyledToolbar>
    </StyledAppBar>
  );
};

export default Header;