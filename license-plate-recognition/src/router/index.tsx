import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../components/Layout';
import Login from '../components/Login';
import VehicleEntry from '../components/VehicleEntry';
import VehicleExit from '../components/VehicleExit';
import Settings from '../components/Settings';
import Statistics from '../components/Statistics';
import Records from '../components/Records';
import PrivateRoute from '../components/PrivateRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <Navigate to="/entry" replace />,
      },
      {
        path: 'entry',
        element: (
          <PrivateRoute allowedRoles={['operator', 'admin']}>
            <VehicleEntry />
          </PrivateRoute>
        ),
      },
      {
        path: 'exit',
        element: (
          <PrivateRoute allowedRoles={['operator', 'admin']}>
            <VehicleExit />
          </PrivateRoute>
        ),
      },
      {
        path: 'records',
        element: (
          <PrivateRoute allowedRoles={['operator', 'admin']}>
            <Records />
          </PrivateRoute>
        ),
      },
      {
        path: 'statistics',
        element: (
          <PrivateRoute allowedRoles={['admin']}>
            <Statistics />
          </PrivateRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <PrivateRoute allowedRoles={['admin']}>
            <Settings />
          </PrivateRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);