import React from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box,
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import PropTypes from 'prop-types';
import axios from 'axios';

import './styles.css';

function TopBar({ user, onLogout }) {
  const queryClient = useQueryClient();
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await axios.post('/admin/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(['currentUser'], null);
      queryClient.invalidateQueries(['currentUser']);
      onLogout();
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const location = useLocation();
  const path = location.pathname;

  const photosMatch = path.match(/^\/users\/([^/]+)\/photos/);
  const detailMatch = path.match(/^\/users\/([^/]+)$/);

  const activeUserId = photosMatch?.[1] || detailMatch?.[1];

  const { data: viewedUser } = useQuery({
    queryKey: ['user', activeUserId],
    queryFn: async () => {
      const res = await axios.get(`/user/${activeUserId}`);
      return res.data;
    },
    enabled: Boolean(activeUserId) && Boolean(user),
  });

  let contextText = '';

  if (photosMatch && viewedUser) {
    contextText = `Photos of ${viewedUser.first_name} ${viewedUser.last_name}`;
  } else if (detailMatch && viewedUser) {
    contextText = `${viewedUser.first_name} ${viewedUser.last_name}`;
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

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" color="inherit">
              {' '}
              Hi,
              {user.first_name}
            </Typography>
            <Button color="inherit" variant="outlined" onClick={handleLogout}>Logout</Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

TopBar.propTypes = {
  user: PropTypes.shape({
    first_name: PropTypes.string,
  }),
  onLogout: PropTypes.func.isRequired,
};

TopBar.defaultProps = {
  user: null,
};

export default TopBar;
