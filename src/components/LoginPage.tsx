import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  ArrowRight,
  Eye,
  EyeOff,
  Users,
  Shield
} from 'lucide-react';
import Footer from './Footer';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleRoleLogin = async (role: string, route: string) => {
    setLoadingRole(role);
    setIsLoading(true);
    
    // Mock authentication - simulate API call delay
    setTimeout(() => {
      // For demo purposes, navigate directly to the specified dashboard
      // In a real app, this would validate credentials and redirect based on user role
      navigate(route);
      setIsLoading(false);
      setLoadingRole(null);
    }, 1000);
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
            <h1 className="text-3xl font-bold text-gray-900">ProdBay</h1>
          </div>
          <p className="text-center text-gray-600 mt-2">Production Management Platform</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-16">
        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Sign in to access your ProdBay dashboard
            </p>
          </div>

          <div className="space-y-6">
            {/* Demo Form Fields - Visual Only */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email (demo mode)"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password (demo mode)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Role Selection Buttons */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 text-center mb-4">
                Choose your role to access the dashboard:
              </h3>
              
              {/* Producer Login */}
              <button
                onClick={() => handleRoleLogin('producer', '/producer/dashboard')}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && loadingRole === 'producer' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing in as Producer...</span>
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4" />
                    <span>Log in as Producer</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Supplier Login */}
              <button
                onClick={() => handleRoleLogin('supplier', '/supplier/quotes')}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && loadingRole === 'supplier' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing in as Supplier...</span>
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4" />
                    <span>Log in as Supplier</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Admin Login */}
              <button
                onClick={() => handleRoleLogin('admin', '/admin/dashboard')}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && loadingRole === 'admin' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing in as Admin...</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    <span>Log in as Admin</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Demo Information */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Demo Mode:</strong> This is a demonstration version with role-based access. 
              Click any role button above to access the corresponding dashboard. 
              Form fields are for visual purposes only.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default LoginPage;
// Build stamp footer is shown on layout pages; duplicate minimal stamp here for root route
export const __BUILD_STAMP__ = import.meta.env.VITE_BUILD_ID;