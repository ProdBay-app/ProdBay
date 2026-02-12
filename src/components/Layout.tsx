import React from 'react';
import { Outlet, NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { Users, Heart, FileText, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Footer from './Footer';
import DarkVeil from './DarkVeil';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const currentPath = location.pathname;

  // Determine if this is the landing page
  const isLandingPage = currentPath === '/';

  // Conditional animation speed: 0.4 for landing page, 0.04 (10%) for app pages
  const animationSpeed = isLandingPage ? 0.4 : 0.04;

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('[Layout] Error signing out:', error);
      // Still redirect to home page even if signOut fails
      navigate('/');
    }
  };

  const isClientPath = currentPath.startsWith('/client');
  const isProducerPath = currentPath.startsWith('/producer');
  const isAdminPath = currentPath.startsWith('/admin');
  const isSupplierPath = currentPath.startsWith('/supplier') || currentPath.startsWith('/quote');

  const getNavLinks = () => {
    if (isClientPath) {
      return [
        { to: '/client/dashboard', label: 'Dashboard', icon: BarChart3 },
        { to: '/client/new-project', label: 'New Wedding', icon: FileText }
      ];
    }
    if (isProducerPath) {
      return [
        { to: '/producer/dashboard', label: 'Dashboard', icon: BarChart3 },
        { to: '/producer/suppliers', label: 'Vendors', icon: Users }
      ];
    }
    if (isSupplierPath) {
      return [
        { to: '/supplier/quotes', label: 'My Quotes', icon: FileText },
        { to: '/supplier/submit', label: 'Submit Quote', icon: FileText }
      ];
    }
    if (isAdminPath) {
      return [
        { to: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 }
      ];
    }
    return [];
  };

  const getUserTypeLabel = () => {
    if (isClientPath) return 'Couple Portal';
    if (isProducerPath) return 'Planner Portal';
    if (isAdminPath) return 'Admin Portal';
    if (isSupplierPath) return 'Vendor Portal';
    return 'WedBay';
  };

  const navLinks = getNavLinks();
  const userTypeLabel = getUserTypeLabel();
  const showNavLinks = !isLandingPage && navLinks.length > 0;

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Dark Veil Background */}
      <div className="fixed inset-0 w-full h-full z-0">
        <DarkVeil
          speed={animationSpeed}
          hueShift={0}
          noiseIntensity={0}
          scanlineFrequency={1.8}
          scanlineIntensity={0.16}
          warpAmount={5}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Fogged-out Header */}
        <nav className="sticky top-0 bg-transparent backdrop-blur-sm shadow-sm z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 sm:space-x-3">
              <Link 
                to="/" 
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
                title="Go to Home"
              >
                  <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-pink-300 drop-shadow-lg" />
                  <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">WedBay</h1>
                  {!isLandingPage && (
                    <span className="text-sm opacity-75 text-white/90 drop-shadow-md">| {userTypeLabel}</span>
                  )}
              </Link>
              
                {/* Navigation Links - only show on app pages */}
                {showNavLinks && (
                  <div className="hidden md:flex space-x-4 ml-8">
                    {navLinks.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
                )}
              </div>

              {/* Auth Buttons - hidden on landing page, visible on all other pages */}
              {!isLandingPage && (
                <>
                  {user ? (
                    <div className="flex items-center space-x-3">
                      <Link
                        to="/producer/dashboard"
                        className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors rounded-lg shadow-md hover:shadow-lg"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Link
                        to="/login"
                        className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                      >
                        Login
                      </Link>
                      <Link
                        to="/signup"
                        className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors rounded-lg shadow-md hover:shadow-lg"
                      >
                        Sign Up
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Subtitle - only show on app pages */}
            {!isLandingPage && (
              <div className="text-sm opacity-75 text-white/90 drop-shadow-md hidden sm:block">
                Wedding Planning Platform
              </div>
            )}
          </div>
        </nav>

        <main className={`flex-1 max-w-7xl mx-auto w-full ${isLandingPage ? 'px-4' : 'py-8 px-4'}`}>
        <Outlet />
      </main>

      <Footer />
      </div>
    </div>
  );
};

export default Layout;