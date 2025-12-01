import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Package, 
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Footer from './Footer';
import { useAuth } from '@/contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSignupMode = searchParams.get('mode') === 'signup';
  const { signIn, signUp, role, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginAttempted, setLoginAttempted] = useState(false);

  const handleLogoClick = () => {
    navigate('/');
  };

  // Redirect based on role - works for both new logins and already-authenticated users
  useEffect(() => {
    // Only redirect when auth loading is complete and we have a role
    if (!authLoading && role) {
      // Reset submitting state if a login was attempted
      if (loginAttempted) {
        setIsSubmitting(false);
      }
      
      // Redirect based on role
      if (role === 'PRODUCER') {
        navigate('/producer/dashboard', { replace: true });
      } else if (role === 'SUPPLIER') {
        navigate('/supplier/quotes', { replace: true });
      } else if (role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        // Unknown role - only show error if login was attempted
        if (loginAttempted) {
          setError('Unauthorized role. Please contact support.');
          setIsSubmitting(false);
        }
      }
    } else if (!authLoading && loginAttempted && !role) {
      // Login was attempted but role is still null after auth loading completes
      // This could happen if profile fetch failed
      setError('Failed to load user profile. Please try again or contact support.');
      setIsSubmitting(false);
      setLoginAttempted(false);
    }
  }, [role, authLoading, navigate, loginAttempted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setLoginAttempted(true);

    try {
      if (isSignupMode) {
        // Signup mode
        if (password !== confirmPassword) {
          setError('Passwords do not match. Please try again.');
          setIsSubmitting(false);
          setLoginAttempted(false);
          return;
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setIsSubmitting(false);
          setLoginAttempted(false);
          return;
        }

        const { error: signUpError } = await signUp(email, password);

        if (signUpError) {
          // Handle specific error messages
          if (signUpError.message.includes('User already registered')) {
            setError('An account with this email already exists. Please sign in instead.');
          } else if (signUpError.message.includes('Password')) {
            setError('Password does not meet requirements. Please try again.');
          } else {
            setError(signUpError.message || 'An error occurred during sign up. Please try again.');
          }
          setIsSubmitting(false);
          setLoginAttempted(false);
          return;
        }

        // Success - wait for AuthContext to update role, then redirect via useEffect
        // The useEffect will handle setting isSubmitting to false and redirecting
      } else {
        // Login mode
        const { error: signInError } = await signIn(email, password);

        if (signInError) {
          // Handle specific error messages
          if (signInError.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.');
          } else if (signInError.message.includes('Email not confirmed')) {
            setError('Please verify your email address before signing in.');
          } else {
            setError(signInError.message || 'An error occurred during sign in. Please try again.');
          }
          setIsSubmitting(false);
          setLoginAttempted(false);
          return;
        }

        // Success - wait for AuthContext to update role, then redirect via useEffect
        // The useEffect will handle setting isSubmitting to false and redirecting
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
      setLoginAttempted(false);
    }
  };

  // Show full-page loading spinner while checking initial session
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Fogged-out Header */}
      <div className="sticky top-0 bg-transparent backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div 
            className="flex items-center justify-center space-x-2 sm:space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
            title="Go to Home"
          >
            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 drop-shadow-lg" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 drop-shadow-lg">ProdBay</h1>
          </div>
          <p className="text-center text-gray-600 mt-2 text-sm sm:text-base drop-shadow-md">Production Management Platform</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-16">
        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isSignupMode ? 'Create Your Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600">
              {isSignupMode 
                ? 'Sign up to start managing your production workflow'
                : 'Sign in to access your ProdBay dashboard'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                required
                disabled={isSubmitting || authLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  required
                  disabled={isSubmitting || authLoading}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder={isSignupMode ? "Create a password (min. 6 characters)" : "Enter your password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting || authLoading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:cursor-not-allowed"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Input (Signup mode only) */}
            {isSignupMode && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError(null);
                    }}
                    required
                    disabled={isSubmitting || authLoading}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isSubmitting || authLoading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:cursor-not-allowed"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || authLoading || !email || !password || (isSignupMode && !confirmPassword)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isSignupMode ? 'Creating account...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <span>{isSignupMode ? 'Sign Up' : 'Sign In'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Toggle between Login and Signup */}
            <div className="text-center text-sm">
              {isSignupMode ? (
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Sign in
                  </button>
                </p>
              ) : (
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login?mode=signup')}
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Sign up
                  </button>
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default LoginPage;
// Build stamp footer is shown on layout pages; duplicate minimal stamp here for root route
export const __BUILD_STAMP__ = import.meta.env.VITE_BUILD_ID;