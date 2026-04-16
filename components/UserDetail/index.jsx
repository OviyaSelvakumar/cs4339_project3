import React, { useState, useEffect } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  Typography, Button, CircularProgress, Box, Divider,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

import './styles.css';

function UserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get(`/user/${userId}`)
      .then((res) => {
        setUser(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('User not found.');
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <CircularProgress sx={{ m: 2 }} />;
  if (error) return <Typography color="error">{error}</Typography>;
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
        <strong>Location:</strong>
        {' '}
        {user.location}
      </Typography>
      <Typography variant="body1">
        <strong>Occupation:</strong>
        {' '}
        {user.occupation}
      </Typography>
      <Typography variant="body1" sx={{ mt: 1 }}>{user.description}</Typography>
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
