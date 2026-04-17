import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

import './styles.css';

function TopBar() {
  const location = useLocation();
  const path = location.pathname;

  const photosMatch = path.match(/^\/users\/([^/]+)\/photos/);
  const detailMatch = path.match(/^\/users\/([^/]+)$/);

  const activeUserId = photosMatch?.[1] || detailMatch?.[1];

  const { data: user } = useQuery({
    queryKey: ['user', activeUserId],
    queryFn: async () => {
      const res = await api.get(`/user/${activeUserId}`);
      return res.data;
    },
    enabled: Boolean(activeUserId),
  });

  let contextText = '';

  if (photosMatch && user) {
    contextText = `Photos of ${user.first_name} ${user.last_name}`;
  } else if (detailMatch && user) {
    contextText = `${user.first_name} ${user.last_name}`;
  }

  return (
    <AppBar className="topbar-appBar" position="absolute">
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h5" color="inherit">
          Oviya Selvakumar & Susan Zhang
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
