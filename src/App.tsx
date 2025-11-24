import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { SupplierImpersonationProvider } from '@/contexts/SupplierImpersonationContext';
import LoadingFallback from '@/components/LoadingFallback';

// Lazy-loaded routes and layouts to reduce initial bundle size
const Layout = lazy(() => import('@/components/Layout'));
const Home = lazy(() => import('@/components/Home'));
const LoginPage = lazy(() => import('@/components/LoginPage'));

// Lazy-loaded dashboard routes to avoid eager initialization side-effects (e.g., Supabase client)
const ClientDashboard = lazy(() => import('@/components/client/ClientDashboardContainer'));
const NewProject = lazy(() => import('@/components/client/NewProject'));
// ProducerDashboard - DEPRECATED: Replaced by ActiveProjectsGrid with projectLimit prop
// const ProducerDashboard = lazy(() => import('@/components/producer/ProducerDashboardContainer'));
const ActiveProjectsGrid = lazy(() => import('@/components/producer/ActiveProjectsGrid'));
const AllProjectsPage = lazy(() => import('@/components/producer/AllProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/components/producer/ProjectDetailPage'));
const SupplierManagement = lazy(() => import('@/components/producer/SupplierManagement'));
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard'));
const QuoteSubmission = lazy(() => import('@/components/supplier/QuoteSubmission'));
const SupplierDashboard = lazy(() => import('@/components/supplier/SupplierDashboardContainer'));
const SupplierSubmitQuote = lazy(() => import('@/components/supplier/SupplierSubmitQuote'));

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
        {/* Public landing page - now wrapped in Layout for consistent background/header */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
        </Route>
        
        {/* Login page - outside of layout */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Client routes */}
        <Route path="/client" element={<Layout />}>
          <Route index element={<Navigate to="/client/dashboard" replace />} />
          <Route path="dashboard" element={<ClientDashboard />} />
          <Route path="new-project" element={<NewProject />} />
        </Route>
        
        {/* Supplier routes */}
        <Route path="/supplier" element={
          <SupplierImpersonationProvider>
            <Layout />
          </SupplierImpersonationProvider>
        }>
          <Route index element={<Navigate to="/supplier/quotes" replace />} />
          <Route path="quotes" element={<SupplierDashboard />} />
          <Route path="submit" element={<SupplierSubmitQuote />} />
        </Route>
        
        {/* Producer routes */}
        <Route path="/producer" element={<Layout />}>
          <Route index element={<Navigate to="/producer/dashboard" replace />} />
          <Route path="dashboard" element={<ActiveProjectsGrid projectLimit={6} showStats={true} />} />
          <Route path="projects" element={<AllProjectsPage />} />
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
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