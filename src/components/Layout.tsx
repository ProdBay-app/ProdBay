import React from 'react';
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { Building2, Users, Package, FileText, Shield, BarChart3 } from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isClientPath = false; // client portal removed
  const isProducerPath = currentPath.startsWith('/producer');
  const isAdminPath = currentPath.startsWith('/admin');
  const isSupplierPath = currentPath.startsWith('/supplier') || currentPath.startsWith('/quote');

  const getNavColor = () => {
    if (isClientPath) return 'bg-blue-600';
    if (isProducerPath) return 'bg-teal-600';
    if (isAdminPath) return 'bg-gray-800';
    if (isSupplierPath) return 'bg-orange-600';
    return 'bg-gray-800';
  };

  const getNavLinks = () => {
    if (isProducerPath) {
      return [
        { to: '/producer/dashboard', label: 'Projects', icon: Building2 },
        { to: '/producer/suppliers', label: 'Suppliers', icon: Users }
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
    if (isProducerPath) return 'Producer Portal';
    if (isAdminPath) return 'Admin Portal';
    if (isSupplierPath) return 'Supplier Portal';
    return 'ProdBay';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className={`${getNavColor()} text-white shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link 
                to="/" 
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
                title="Go to Home"
              >
                <Package className="h-8 w-8" />
                <span className="text-xl font-bold">ProdBay</span>
                <span className="text-sm opacity-75">| {getUserTypeLabel()}</span>
              </Link>
              
              <div className="hidden md:flex space-x-4">
                {getNavLinks().map(({ to, label, icon: Icon }) => (
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
            </div>

            <div className="text-sm opacity-75">
              Production Management System
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;