import React from 'react';
import {
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

import './styles.css';

async function fetchUserList() {
  const res = await api.get('/user/list');
  return res.data;
}

function UserList() {
  const navigate = useNavigate();

  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUserList,
  });

  if (isLoading) return <CircularProgress sx={{ m: 2 }} />;
  if (error) return <Typography color="error">Failed to load users.</Typography>;
  if (!users || users.length === 0) return <Typography>No users found.</Typography>;

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
