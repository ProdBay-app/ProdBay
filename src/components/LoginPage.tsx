import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Heart, 
  ArrowRight,
  Eye,
  EyeOff,
  Mail
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Footer from './Footer';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || 'Invalid email or password. Please try again.');
        setIsLoading(false);
        return;
      }

      // Success - redirect new users to onboarding
      if (data.user) {
        try {
          const [projectsCountResult, suppliersCountResult] = await Promise.all([
            supabase
              .from('projects')
              .select('id', { count: 'exact', head: true })
              .eq('producer_id', data.user.id),
            supabase
              .from('suppliers')
              .select('id', { count: 'exact', head: true })
          ]);

          if (projectsCountResult.error) throw projectsCountResult.error;
          if (suppliersCountResult.error) throw suppliersCountResult.error;

          const hasCompanyInfo = typeof data.user.user_metadata?.company_name === 'string' &&
            data.user.user_metadata.company_name.trim().length > 0;

          const hasProjects = (projectsCountResult.count ?? 0) > 0;
          const hasSuppliers = (suppliersCountResult.count ?? 0) > 0;

          if (!hasCompanyInfo || !hasProjects || !hasSuppliers) {
            navigate('/onboarding');
            return;
          }
        } catch (routingError) {
          console.warn('[Login] Failed onboarding check, falling back to dashboard:', routingError);
        }

        navigate('/producer/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Sign in error:', err);
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
        {/* Login Form */}
        <div className="bg-white rounded-wedding-lg shadow-wedding-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-wedding-slate mb-2">
              Welcome Back
            </h2>
            <p className="text-wedding-slate-muted">
              Sign in to access your WedBay dashboard
            </p>
          </div>

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
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
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
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
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
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Link to Sign Up */}
              <div className="text-center">
                <p className="text-sm text-wedding-slate-muted">
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="text-wedding-primary hover:text-wedding-primary-hover font-medium"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      <Footer variant="light" />
    </div>
  );
};

export default LoginPage;
// Build stamp footer is shown on layout pages; duplicate minimal stamp here for root route
export const __BUILD_STAMP__ = import.meta.env.VITE_BUILD_ID;