import React, { useState, useEffect } from 'react';
import {
  Typography, CircularProgress, Box, Card, CardMedia,
  CardContent, Divider, List, ListItem,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

import './styles.css';

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function UserPhotos() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get(`/photosOfUser/${userId}`)
      .then((res) => {
        setPhotos(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load photos.');
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <CircularProgress sx={{ m: 2 }} />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (photos.length === 0) {
    return <Typography sx={{ p: 2 }}>No photos available.</Typography>;
  }

  return (
    <Box sx={{ p: 2 }}>
      {photos.map((photo) => (
        <Card key={photo._id} sx={{ mb: 3 }}>
          <CardMedia
            component="img"
            image={`/images/${photo.file_name}`}
            alt="User photo"
            sx={{ maxHeight: 400, objectFit: 'contain', bgcolor: '#f5f5f5' }}
          />
          <CardContent>
            <Typography variant="caption" color="text.secondary">
              {formatDate(photo.date_time)}
            </Typography>
            <Divider sx={{ my: 1 }} />
            {photo.comments && photo.comments.length > 0 ? (
              <div>
                <Typography variant="subtitle2" gutterBottom>Comments:</Typography>
                <List disablePadding>
                  {photo.comments.map((comment) => (
                    <ListItem
                      key={comment._id}
                      disableGutters
                      sx={{ flexDirection: 'column', alignItems: 'flex-start', mb: 1 }}
                    >
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography
                          component="button"
                          variant="subtitle2"
                          onClick={() => navigate(`/users/${comment.user._id}`)}
                          sx={{
                            cursor: 'pointer',
                            background: 'none',
                            border: 'none',
                            color: 'primary.main',
                            fontWeight: 'bold',
                            p: 0,
                          }}
                        >
                          {comment.user.first_name}
                          {' '}
                          {comment.user.last_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(comment.date_time)}
                        </Typography>
                      </Box>
                      <Typography variant="body2">{comment.comment}</Typography>
                    </ListItem>
                  ))}
                </List>
              </div>
            ) : (
              <Typography variant="body2" color="text.secondary">No comments yet.</Typography>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

export default UserPhotos;
