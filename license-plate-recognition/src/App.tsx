import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './components/Login';
import VehicleEntry from './components/VehicleEntry';
import VehicleExit from './components/VehicleExit';
import Records from './components/Records';
import Statistics from './components/Statistics';
import Settings from './components/Settings';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<Layout />}>
          {/* 默认重定向到入场页面 */}
          <Route index element={<Navigate to="/entry" replace />} />
          
          {/* 收费员和管理员都可以访问的路由 */}
          <Route path="entry" element={
            <PrivateRoute allowedRoles={['operator', 'admin']}>
              <VehicleEntry />
            </PrivateRoute>
          } />
          
          <Route path="exit" element={
            <PrivateRoute allowedRoles={['operator', 'admin']}>
              <VehicleExit />
            </PrivateRoute>
          } />
          
          <Route path="records" element={
            <PrivateRoute allowedRoles={['operator', 'admin']}>
              <Records />
            </PrivateRoute>
          } />

          {/* 只有管理员可以访问的路由 */}
          <Route path="statistics" element={
            <PrivateRoute allowedRoles={['admin']}>
              <Statistics />
            </PrivateRoute>
          } />
          
          <Route path="settings" element={
            <PrivateRoute allowedRoles={['admin']}>
              <Settings />
            </PrivateRoute>
          } />
        </Route>

        {/* 处理未匹配的路由 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;