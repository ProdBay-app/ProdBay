import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import Home from './components/Home';
import { NotificationProvider } from './contexts/NotificationContext';

// Lazy-loaded routes to avoid eager initialization side-effects (e.g., Supabase client)
const ClientDashboard = lazy(() => import('./components/client/ClientDashboard'));
const NewProject = lazy(() => import('./components/client/NewProject'));
const ProducerDashboard = lazy(() => import('./components/producer/ProducerDashboard'));
const SupplierManagement = lazy(() => import('./components/producer/SupplierManagement'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const QuoteSubmission = lazy(() => import('./components/supplier/QuoteSubmission'));
const SupplierDashboard = lazy(() => import('./components/supplier/SupplierDashboard'));
const SupplierSubmitQuote = lazy(() => import('./components/supplier/SupplierSubmitQuote'));

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Suspense fallback={<div style={{ padding: '2rem' }}>Loading...</div>}>
          <Routes>
        {/* Public landing page - outside of layout */}
        <Route path="/" element={<Home />} />
        
        {/* Login page - outside of layout */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Client routes */}
        <Route path="/client" element={<Layout />}>
          <Route index element={<Navigate to="/client/dashboard" replace />} />
          <Route path="dashboard" element={<ClientDashboard />} />
          <Route path="new-project" element={<NewProject />} />
        </Route>
        
        {/* Supplier routes */}
        <Route path="/supplier" element={<Layout />}>
          <Route index element={<Navigate to="/supplier/quotes" replace />} />
          <Route path="quotes" element={<SupplierDashboard />} />
          <Route path="submit" element={<SupplierSubmitQuote />} />
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
        </Suspense>
      </Router>
    </NotificationProvider>
  );
}

export default App;