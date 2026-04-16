import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import ReactDOM from 'react-dom/client';
import { Grid, Typography, Paper } from '@mui/material';
import {
  createBrowserRouter, RouterProvider, Outlet, useParams,
} from 'react-router-dom';

import './styles/main.css';
import TopBar from './components/TopBar';
import UserDetail from './components/UserDetail';
import UserList from './components/UserList';
import UserPhotos from './components/UserPhotos';

function Home() {
  return (
    <Typography variant="body1">
      Welcome to your photosharing app! This
      {' '}
      <a href="https://mui.com/components/paper/" rel="noreferrer" target="_blank">Paper</a>
      {' '}
      component displays the main content of the application. The
      {/* {sm={9}} */}
      {' '}
      prop in the
      {' '}
      <a href="https://mui.com/components/grid/" rel="noreferrer" target="_blank">Grid</a>
      {' '}
      item component makes it responsively display 9/12 of the
      window. The Routes definitions enables us to conditionally
      render different components to this part of the screen.
      There is nothing specific to display here. Use your creativity and show some
      interesting content here.
    </Typography>
  );
}

function UserDetailRoute() {
  const { userId } = useParams();
  // eslint-disable-next-line no-console
  console.log('UserDetailRoute: userId is:', userId);
  return <UserDetail userId={userId} />;
}

function UserPhotosRoute() {
  const { userId } = useParams();
  return <UserPhotos userId={userId} />;
}

function Root() {
  return (
    <div>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TopBar />
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

const router = createBrowserRouter([
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
root.render(<RouterProvider router={router} />);
