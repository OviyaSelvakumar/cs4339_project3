import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  Typography, Button, CircularProgress, Box, Divider,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api.js';

import './styles.css';

async function fetchUserDetail(userId) {
  const res = await api.get(`/user/${userId}`);
  return res.data;
}

function UserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserDetail(userId),
    enabled: Boolean(userId),
  });

  if (isLoading) return <CircularProgress sx={{ m: 2 }} />;
  if (error) return <Typography color="error">User not found.</Typography>;
  if (!user) return null;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        {user.first_name}
        {' '}
        {user.last_name}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="body1">
        <strong>Location: </strong>
        {user.location}
      </Typography>
      <Typography variant="body1">
        <strong>Occupation: </strong>
        {user.occupation}
      </Typography>
      <Typography variant="body1" sx={{ mt: 1 }}>
        {user.description}
      </Typography>
      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={() => navigate(`/users/${userId}/photos`)}
      >
        View Photos
      </Button>
    </Box>
  );
}

export default UserDetail;
