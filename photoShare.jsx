import React, { useState } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import ReactDOM from 'react-dom/client';
import { Grid, Typography, Paper } from '@mui/material';
import {
  createBrowserRouter, Outlet, useParams, Navigate, RouterProvider,
  useNavigate,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import './styles/main.css';
import TopBar from './components/TopBar';
import LoginRegister from './components/LoginRegister';
import UserDetail from './components/UserDetail';
import UserList from './components/UserList';
import UserPhotos from './components/UserPhotos';

axios.defaults.baseURL = "http://localhost:3001";
axios.defaults.withCredentials = true;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 3000
    }
  }
});
function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const res = await axios.get("/admin/me");
        return res.data;
      } catch (err) {
        if (err.response?.status === 401) {
          return null;
        }
        throw err;
      }
    },
    retry: false
  });
}

function Home() {
  return (
    <Typography variant="body1">
      Welcome to your photosharing app!
    </Typography>
  );
}

function UserDetailRoute() {
  const { userId } = useParams();
  return <UserDetail userId={userId} />;
}

function UserPhotosRoute() {
  const { userId } = useParams();
  return <UserPhotos userId={userId} />;
}

function Root() {
  const {data: user, isLoading} = useCurrentUser();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
  }

  if (loggingOut) {
    return <Navigate to="/login-register" replace />;
  }

  if (isLoading) {
    return <Typography>Loading...</Typography>
  }

  if (!user) {
    return <Navigate to="/login-register" replace />;
  }


  return (
    <div>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TopBar user={user} onLogout={handleLogout} />
        </Grid>
        <div className="main-topbar-buffer" />
        <Grid item sm={3}>
          <Paper className="main-grid-item">
            <UserList />
          </Paper>
        </Grid>
        <Grid item sm={9}>
          <Paper className="main-grid-item">
            <Outlet />
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}

function UserLayout() {
  return <Outlet />;
}

function LoginPage() {
  const { data: user, isLoading } = useCurrentUser();
  const navigate = useNavigate();

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (user) {
    return <Navigate to={`/users/${user._id}`} replace />;
  }

  const handleLoginSuccess = (userData) => {
  queryClient.setQueryData(['currentUser'], userData);
    navigate(`/users/${userData._id}`);
  };

  return <LoginRegister onLoginSuccess={handleLoginSuccess} />;
}

const router = createBrowserRouter([
  {
    path: '/login-register',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <Root />,
    children: [
      { index: true, element: <Home /> },
      { path: 'users', element: <UserList /> },
      {
        path: 'users/:userId',
        element: <UserLayout />,
        children: [
          { index: true, element: <UserDetailRoute /> },
          { path: 'photos', element: <UserPhotosRoute /> },
        ],
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById('photoshareapp'));

root.render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
);