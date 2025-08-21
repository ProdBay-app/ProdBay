import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import Home from './components/Home';
import NewProject from './components/client/NewProject';
import ClientDashboard from './components/client/ClientDashboard';
import ProducerDashboard from './components/producer/ProducerDashboard';
import SupplierManagement from './components/producer/SupplierManagement';
import AdminDashboard from './components/admin/AdminDashboard';
import QuoteSubmission from './components/supplier/QuoteSubmission';

function App() {
  return (
    <Router>
      <Routes>
        {/* Login page - outside of layout */}
        <Route path="/" element={<LoginPage />} />
        
        {/* Marketing home page - outside of layout */}
        <Route path="/home" element={<Home />} />
        
        {/* Client routes */}
        <Route path="/client" element={<Layout />}>
          <Route index element={<Navigate to="/client/dashboard" replace />} />
          <Route path="new" element={<NewProject />} />
          <Route path="dashboard" element={<ClientDashboard />} />
        </Route>
        
        {/* Producer routes */}
        <Route path="/producer" element={<Layout />}>
          <Route index element={<Navigate to="/producer/dashboard" replace />} />
          <Route path="dashboard" element={<ProducerDashboard />} />
          <Route path="suppliers" element={<SupplierManagement />} />
        </Route>
        
        {/* Admin routes */}
        <Route path="/admin" element={<Layout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
        </Route>
        
        {/* Supplier quote route - outside of layout for public access */}
        <Route path="/quote/:token" element={<QuoteSubmission />} />
        
        {/* Catch all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;