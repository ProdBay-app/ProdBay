import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Users, 
  Shield, 
  ArrowRight,
  Mail,
  Info
} from 'lucide-react';
import { APP_NAME, USER_THEMES } from '../constants';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div 
            className="flex items-center justify-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
            title="Go to Home"
          >
            <Package className="h-10 w-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">{APP_NAME}</h1>
          </div>
          <p className="text-center text-gray-600 mt-2">Production Management Platform</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to {APP_NAME}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your role to access your personalized dashboard and manage your production workflow
          </p>
        </div>

        {/* Login Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Supplier Portal */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className={`${USER_THEMES.SUPPLIER.primary} text-white p-6 text-center`}>
              <Users className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold">Supplier Portal</h3>
              <p className="opacity-90 mt-2">Upload and manage your quotes</p>
            </div>
            <div className="p-6">
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li>• Submit quotes for assets</li>
                <li>• View status of submitted quotes</li>
                <li>• Manage notes and capacity</li>
              </ul>
              <Link
                to="/supplier/quotes"
                className={`flex items-center justify-center space-x-2 w-full px-4 py-3 ${USER_THEMES.SUPPLIER.primary} text-white rounded-lg ${USER_THEMES.SUPPLIER.hover} transition-colors font-medium`}
              >
                <span>Supplier Access</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Producer Login */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className={`${USER_THEMES.PRODUCER.primary} text-white p-6 text-center`}>
              <Package className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold">Producer Portal</h3>
              <p className="opacity-90 mt-2">Manage projects and suppliers</p>
            </div>
            <div className="p-6">
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li>• Oversee all active projects</li>
                <li>• Manage asset requirements</li>
                <li>• Coordinate with suppliers</li>
                <li>• Review and accept quotes</li>
              </ul>
              <Link
                to="/producer/dashboard"
                className={`flex items-center justify-center space-x-2 w-full px-4 py-3 ${USER_THEMES.PRODUCER.primary} text-white rounded-lg ${USER_THEMES.PRODUCER.hover} transition-colors font-medium`}
              >
                <span>Producer Login</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Admin Login */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className={`${USER_THEMES.ADMIN.primary} text-white p-6 text-center`}>
              <Shield className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold">Admin Portal</h3>
              <p className="opacity-90 mt-2">System administration</p>
            </div>
            <div className="p-6">
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li>• System configuration</li>
                <li>• User management</li>
                <li>• Analytics and reporting</li>
                <li>• Platform oversight</li>
              </ul>
              <Link
                to="/admin/dashboard"
                className={`flex items-center justify-center space-x-2 w-full px-4 py-3 ${USER_THEMES.ADMIN.primary} text-white rounded-lg ${USER_THEMES.ADMIN.hover} transition-colors font-medium`}
              >
                <span>Admin Login</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-orange-100 rounded-full p-3">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-orange-900 mb-2">
                Supplier Access
              </h3>
              <p className="text-orange-800 mb-3">
                Suppliers can manage their quotes via the Supplier Portal or unique email links.
              </p>
              <div className="flex items-center space-x-2 text-orange-700">
                <Mail className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Quote requests can still be sent directly to supplier email addresses
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Demo Access Information:</p>
              <p className="text-blue-700">
                This is a demonstration version of {APP_NAME}. In a production environment, 
                proper authentication would be implemented with secure login credentials, 
                user sessions, and role-based access control.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;