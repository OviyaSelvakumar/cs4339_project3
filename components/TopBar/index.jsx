import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import api from '../../lib/api';

import './styles.css';

function TopBar() {
  const location = useLocation();
  const [contextText, setContextText] = useState('');

  useEffect(() => {
    const path = location.pathname;
    const photosMatch = path.match(/^\/users\/([^/]+)\/photos/);
    const detailMatch = path.match(/^\/users\/([^/]+)$/);

    if (photosMatch) {
      const id = photosMatch[1];
      api.get(`/user/${id}`)
        .then((res) => {
          setContextText(`Photos of ${res.data.first_name} ${res.data.last_name}`);
        })
        .catch(() => setContextText('Photos'));
    } else if (detailMatch) {
      const id = detailMatch[1];
      api.get(`/user/${id}`)
        .then((res) => {
          setContextText(`${res.data.first_name} ${res.data.last_name}`);
        })
        .catch(() => setContextText('User Detail'));
    } else {
      setContextText('');
    }
  }, [location.pathname]);

  return (
    <AppBar className="topbar-appBar" position="absolute">
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h5" color="inherit">
          Oviya Selvakumar
        </Typography>
        {contextText && (
          <Typography variant="h6" color="inherit">
            {contextText}
          </Typography>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
