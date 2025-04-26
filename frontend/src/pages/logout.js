import React from 'react';
import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from './AuthContext'; // Import useAuth

const Logout = () => {
  const { user, logout } = useAuth(); // Use the logout function from AuthContext

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          Edir Community
        </Typography>
        {user && (
          <IconButton color="inherit" onClick={logout}>
            <LogoutIcon />
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Logout;