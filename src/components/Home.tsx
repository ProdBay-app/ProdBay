import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Users, 
  ArrowRight, 
  CheckCircle,
  FileText, 
  DollarSign,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import RotatingText from './RotatingText';
import ScrollStack, { ScrollStackItem } from './ScrollStack';

const Home: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('[Home] Error signing out:', error);
      // Still redirect to home page even if signOut fails
      navigate('/');
    }
  };

  return (
    <div className="relative">

        {/* Hero Section - 95% of viewport */}
        <div className="min-h-[95vh] flex items-center justify-center relative">
          <div className="text-center max-w-7xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 drop-shadow-lg">
              Wedding Planning{' '}
              <RotatingText
                texts={['Simplified', 'Curated', 'Perfected', 'Coordinated']}
                mainClassName="px-2 text-white overflow-hidden py-0.5 rounded-lg inline-block"
                style={{ backgroundColor: '#0d9488' }}
                staggerFrom={"last"}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden pb-0"
                transition={{ type: "spring", damping: 30, stiffness: 400, layout: { type: "spring", damping: 30, stiffness: 400 } }}
                rotationInterval={2000}
              />
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 max-w-3xl mx-auto drop-shadow-md px-2">
              Streamline your wedding planning from initial brief to the big day. 
              Connect couples, planners, and vendors in one beautiful platform.
            </p>
            
            {/* Hero CTA Buttons - Elegant auth entry points */}
            {!loading && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 sm:mt-10">
                {user ? (
                  <>
                    <Link
                      to="/producer/dashboard"
                      className="px-6 py-3 sm:px-8 sm:py-4 bg-teal-600/90 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-teal-600 transition-colors text-base sm:text-lg shadow-lg hover:shadow-xl border border-teal-500/20"
                    >
                      Dashboard
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 inline ml-2" />
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="px-6 py-3 sm:px-8 sm:py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/20 transition-colors text-base sm:text-lg shadow-lg hover:shadow-xl border border-white/20"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-6 py-3 sm:px-8 sm:py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/20 transition-colors text-base sm:text-lg shadow-lg hover:shadow-xl border border-white/20"
                    >
                      Login
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 inline ml-2" />
                    </Link>
                    <Link
                      to="/signup"
                      className="px-6 py-3 sm:px-8 sm:py-4 bg-teal-600/90 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-teal-600 transition-colors text-base sm:text-lg shadow-lg hover:shadow-xl border border-teal-500/20"
                    >
                      Sign Up
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 inline ml-2" />
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scroll Stack Section */}
        <div className="relative">
          <ScrollStack
            useWindowScroll={true}
            itemDistance={110}
            itemScale={0.03}
            itemStackDistance={20}
            stackPosition="20%"
            scaleEndPosition="10%"
            baseScale={0.7}
            scaleDuration={0.5}
            rotationAmount={0}
            blurAmount={1.5}
          >
            <ScrollStackItem itemClassName="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <div className="flex flex-col items-center justify-center h-full">
                <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600 mb-3 sm:mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Smart Brief Parsing</h3>
                <p className="text-gray-700 text-center text-sm sm:text-base lg:text-lg">
                  Automatically identify required services from wedding briefs with intelligent parsing
                </p>
              </div>
            </ScrollStackItem>

            <ScrollStackItem itemClassName="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200">
              <div className="flex flex-col items-center justify-center h-full">
                <Users className="h-12 w-12 sm:h-16 sm:w-16 text-teal-600 mb-3 sm:mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Vendor Network</h3>
                <p className="text-gray-700 text-center text-sm sm:text-base lg:text-lg">
                  Intelligent matching with the perfect wedding vendors based on your vision and needs
                </p>
              </div>
            </ScrollStackItem>

            <ScrollStackItem itemClassName="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
              <div className="flex flex-col items-center justify-center h-full">
                <DollarSign className="h-12 w-12 sm:h-16 sm:w-16 text-green-600 mb-3 sm:mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Quote Management</h3>
                <p className="text-gray-700 text-center text-sm sm:text-base lg:text-lg">
                  Collect and compare vendor quotes effortlessly to stay within your wedding budget
                </p>
              </div>
            </ScrollStackItem>

            <ScrollStackItem itemClassName="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
              <div className="flex flex-col items-center justify-center h-full">
                <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-orange-600 mb-3 sm:mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Timeline Tracking</h3>
                <p className="text-gray-700 text-center text-sm sm:text-base lg:text-lg">
                  Track every detail of your wedding planning timeline with real-time status updates
                </p>
              </div>
            </ScrollStackItem>
          </ScrollStack>
        </div>

        {/* User Portals Section */}
        <div className="relative z-10 pt-4 sm:pt-8 pb-12 sm:pb-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-center mb-8 sm:mb-16">
              {/* Producer Portal */}
              <div className="w-full max-w-2xl bg-white/95 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden transform transition-all hover:shadow-2xl">
                <div className="bg-teal-600 text-white p-6 sm:p-8">
                  <Heart className="h-12 w-12 sm:h-16 sm:w-16 mb-4 sm:mb-5" />
                  <h3 className="text-2xl sm:text-3xl font-bold">Planner Portal</h3>
                  <p className="opacity-90 mt-2 text-base sm:text-lg">Manage weddings and vendors</p>
                </div>
                <div className="p-6 sm:p-8">
                  <ul className="space-y-3 sm:space-y-4 mb-8">
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 text-base sm:text-lg">Wedding overview dashboard</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 text-base sm:text-lg">Service coordination</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 text-base sm:text-lg">Vendor management</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 text-base sm:text-lg">Quote review and booking</span>
                    </li>
                  </ul>
                  <Link
                    to="/producer/dashboard"
                    className="w-full bg-teal-600 text-white py-3 px-6 rounded-lg hover:bg-teal-700 transition-colors text-center block font-medium text-base sm:text-lg shadow-md hover:shadow-lg"
                  >
                    Access Planner Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Section */}
        <div className="relative z-10 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 sm:p-6 md:p-8 mb-16">
              <h3 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-6 sm:mb-8">
                Seamless Wedding Planning Workflow
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Wedding Brief</h4>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Couple submits their wedding brief with vision, requirements, and details
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-teal-100 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl font-bold text-teal-600">2</span>
                  </div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Smart Processing</h4>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    System parses the brief and identifies all required wedding services
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-orange-100 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl font-bold text-orange-600">3</span>
                  </div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Vendor Matching</h4>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Matched vendors automatically receive quote requests via email
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl font-bold text-green-600">4</span>
                  </div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Quote & Booking</h4>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Planner reviews quotes and manages the wedding through to the big day
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative z-10 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center px-2">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg">
                Ready to plan the perfect wedding?
              </h3>
              <p className="text-base sm:text-lg text-white/90 mb-6 sm:mb-8 drop-shadow-md">
                Get started with WedBay and bring your dream wedding to life
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/login"
                  className="px-6 py-3 sm:px-8 sm:py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-base sm:text-lg shadow-lg hover:shadow-xl"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 inline ml-2" />
                </Link>
              </div>
              <p className="text-xs sm:text-sm text-white/80 mt-4 drop-shadow-sm">
                Secure login required to access your personalized dashboard
              </p>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Home;
