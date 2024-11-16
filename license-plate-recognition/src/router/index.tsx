import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../components/Layout';
import ParkingManagement from '../components/ParkingManagement';
import Settings from '../components/Settings';
import Statistics from '../components/Statistics';
import Records from '../components/Records';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <ParkingManagement />,
      },
      {
        path: '/parking',
        element: <ParkingManagement />,
      },
      {
        path: '/settings',
        element: <Settings />,
      },
      {
        path: '/statistics',
        element: <Statistics />,
      },
      {
        path: '/records',
        element: <Records />,
      },
    ],
  },
]);