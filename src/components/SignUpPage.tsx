import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Heart, 
  Eye,
  EyeOff,
  Mail,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Footer from './Footer';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string>('');

  const handleLogoClick = () => {
    navigate('/');
  };

  const validateForm = (): boolean => {
    setError(null);

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    // Password length validation (Supabase minimum is 6)
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }

    // Password match validation
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the current origin for email redirect
      const redirectTo = `${window.location.origin}/onboarding`;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (signUpError) {
        setError(signUpError.message || 'An error occurred during sign up. Please try again.');
        setIsLoading(false);
        return;
      }

      // Success - if a session is immediately created, send user to onboarding.
      // Otherwise, keep the existing email verification flow.
      if (data.session && data.user) {
        navigate('/onboarding');
        return;
      }

      // Success - user created (email verification flow)
      if (data.user) {
        setSuccessEmail(email);
        setSuccess(true);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Sign up error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-wedding-secondary/50 via-wedding-neutral to-wedding-primary/20">
      {/* Fogged-out Header */}
      <div className="sticky top-0 bg-transparent backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div 
            className="flex items-center justify-center space-x-2 sm:space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
            title="Go to Home"
          >
            <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-wedding-accent drop-shadow-lg" />
            <h1 className="text-xl sm:text-2xl font-bold text-wedding-slate drop-shadow-lg">WedBay</h1>
          </div>
          <p className="text-center text-wedding-slate-muted mt-2 text-sm sm:text-base drop-shadow-md">Wedding Planning Platform</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-16">
        {/* Sign Up Form */}
        <div className="bg-white rounded-wedding-lg shadow-wedding-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-wedding-slate mb-2">
              Create an Account
            </h2>
            <p className="text-wedding-slate-muted">
              Sign up to get started with WedBay
            </p>
          </div>

          {success ? (
            /* Success Message */
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-wedding-primary/20 p-4">
                  <CheckCircle2 className="h-12 w-12 text-wedding-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-wedding-slate mb-3">
                Check Your Email
              </h3>
              <p className="text-wedding-slate mb-2">
                We've sent a confirmation link to:
              </p>
              <p className="text-wedding-slate font-medium mb-6 break-all">
                {successEmail}
              </p>
              <p className="text-wedding-slate-muted text-sm mb-6">
                Click the link in the email to verify your account and complete the sign-up process.
              </p>
              <Link
                to="/login"
                className="block w-full bg-wedding-primary text-white py-3 px-4 rounded-wedding hover:bg-wedding-primary-hover transition-colors text-center font-medium"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-wedding-slate mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-wedding-slate-muted" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-wedding-secondary rounded-wedding focus:outline-none focus:ring-2 focus:ring-wedding-primary focus:border-transparent"
                      placeholder="Enter your email"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-wedding-slate mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-wedding-secondary rounded-wedding focus:outline-none focus:ring-2 focus:ring-wedding-primary focus:border-transparent"
                      placeholder="Enter your password (min. 6 characters)"
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-wedding-slate-muted" />
                      ) : (
                        <Eye className="h-4 w-4 text-wedding-slate-muted" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-wedding-slate-muted">
                    Must be at least 6 characters long
                  </p>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-wedding-slate mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-wedding-secondary rounded-wedding focus:outline-none focus:ring-2 focus:ring-wedding-primary focus:border-transparent"
                      placeholder="Confirm your password"
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-wedding-slate-muted" />
                      ) : (
                        <Eye className="h-4 w-4 text-wedding-slate-muted" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-wedding">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-wedding-primary text-white py-3 px-4 rounded-wedding hover:bg-wedding-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>

                {/* Link to Login */}
                <div className="text-center">
                  <p className="text-sm text-wedding-slate-muted">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="text-wedding-primary hover:text-wedding-primary-hover font-medium"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
      
      <Footer variant="light" />
    </div>
  );
};

export default SignUpPage;
// Build stamp footer is shown on layout pages; duplicate minimal stamp here for root route
export const __BUILD_STAMP__ = import.meta.env.VITE_BUILD_ID;

