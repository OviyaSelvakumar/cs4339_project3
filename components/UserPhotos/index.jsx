import React from 'react';
import {
  Typography, CircularProgress, Box, Card, CardMedia,
  CardContent, Divider, List, ListItem,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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

async function fetchPhotos(userId) {
  const res = await api.get(`/photosOfUser/${userId}`);
  return res.data;
}

function UserPhotos() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const {
    data: photos,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['photos', userId],
    queryFn: () => fetchPhotos(userId),
    enabled: Boolean(userId),
  });

  if (isLoading) return <CircularProgress sx={{ m: 2 }} />;
  if (error) return <Typography color="error">Could not load photos.</Typography>;
  if (!photos || photos.length === 0) {
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
