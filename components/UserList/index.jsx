import React, { useState, useEffect } from 'react';
import {
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

import './styles.css';

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/user/list')
      .then((res) => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load users.');
        setLoading(false);
      });
  }, []);

  if (loading) return <CircularProgress sx={{ m: 2 }} />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (users.length === 0) return <Typography>No users found.</Typography>;

  return (
    <div>
      <Typography variant="h6" sx={{ p: 1 }}>Users</Typography>
      <List component="nav" disablePadding>
        {users.map((user, index) => (
          <React.Fragment key={user._id}>
            <ListItemButton onClick={() => navigate(`/users/${user._id}`)}>
              <ListItemText primary={`${user.first_name} ${user.last_name}`} />
            </ListItemButton>
            {index < users.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </div>
  );
}

export default UserList;
