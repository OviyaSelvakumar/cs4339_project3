import React, { useState } from 'react';
import {
  Button, Box, TextField, Tabs, Tab, Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import PropTypes from 'prop-types';
import axios from 'axios';

axios.defaults.withCredentials = true;

function LoginRegister({ onLoginSuccess }) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState('');

  // A login form with login_name and password fields
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // A registration form with all required fields
  const [regLoginName, setRegLoginName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regLocation, setRegLocation] = useState('');
  const [regDescription, setRegDescription] = useState('');
  const [regOccupation, setRegOccupation] = useState('');

  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await axios.post('/admin/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data);
      onLoginSuccess(data);
      navigate(`/users/${data._id}`);
    },
    onError: (err) => {
      setError(err.response?.data || 'Login failed!');
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData) => {
      const response = await axios.post('/user', userData);
      return response.data;
    },
    onSuccess: () => {
      loginMutation.mutate({
        login_name: regLoginName,
        password: regPassword,
      });
    },
    onError: (err) => {
      setError(err.response?.data || 'Registration failed!');
    },
  });

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate({
      login_name: loginName,
      password: loginPassword,
    });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    registerMutation.mutate({
      login_name: regLoginName,
      password: regPassword,
      first_name: regFirstName,
      last_name: regLastName,
      location: regLocation,
      description: regDescription,
      occupation: regOccupation,
    });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
  };

  return (
    <Box sx={{ mx: 'auto', mt: 4, p: 2 }}>
      <Tabs value={activeTab} onChange={handleTabChange} centered>
        <Tab label="Login" />
        <Tab label="Register" />
      </Tabs>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {activeTab === 0 && (
      <Box component="form" onSubmit={handleLogin} sx={{ mt: 2 }}>
        <TextField fullWidth label="Login Name" value={loginName} onChange={(e) => setLoginName(e.target.value)} margin="normal" required />
        <TextField fullWidth label="Password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} margin="normal" required />
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Logging in' : 'Login'}
        </Button>
      </Box>
      )}

      {activeTab === 1 && (
      <Box component="form" onSubmit={handleRegister} sx={{ mt: 2 }}>
        <TextField fullWidth label="Login Name" value={regLoginName} onChange={(e) => setRegLoginName(e.target.value)} margin="normal" required />
        <TextField fullWidth label="Password" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} margin="normal" required />
        <TextField fullWidth label="First Name" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} margin="normal" required />
        <TextField fullWidth label="Last Name" value={regLastName} onChange={(e) => setRegLastName(e.target.value)} margin="normal" required />
        <TextField fullWidth label="Location" value={regLocation} onChange={(e) => setRegLocation(e.target.value)} margin="normal" />
        <TextField fullWidth label="Description" value={regDescription} onChange={(e) => setRegDescription(e.target.value)} margin="normal" multiline rows={2} />
        <TextField fullWidth label="Occupation" value={regOccupation} onChange={(e) => setRegOccupation(e.target.value)} margin="normal" />
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={registerMutation.isPending}>
          {registerMutation.isPending ? 'Registering' : 'Register'}
        </Button>
      </Box>
      )}
    </Box>
  );
}

LoginRegister.propTypes = {
  onLoginSuccess: PropTypes.func.isRequired,
};

export default LoginRegister;
