
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import CustomerProfileForm from './pages/CustomerProfileForm';
import SubscriptionRenewalForm from './pages/SubscriptionRenewalForm';
import ServiceForm from './pages/ServiceForm';
import History from './pages/History';
import Login from './pages/Login';
import { authService } from './services/authService';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  if (roles && !authService.hasRole(roles as any)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute roles={['ADMIN', 'SALES']}><CustomerProfileForm /></ProtectedRoute>} />
          <Route path="/renewal" element={<ProtectedRoute roles={['ADMIN', 'SALES']}><SubscriptionRenewalForm /></ProtectedRoute>} />
          <Route path="/service" element={<ProtectedRoute roles={['ADMIN', 'TECHNICIAN']}><ServiceForm /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><History /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
