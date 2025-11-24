import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Package,
  Users, 
  ArrowRight, 
  CheckCircle,
  FileText, 
  DollarSign,
  Clock
} from 'lucide-react';
import RotatingText from './RotatingText';
import ScrollStack, { ScrollStackItem } from './ScrollStack';

const Home: React.FC = () => {
  return (
    <div className="relative">

        {/* Hero Section - 95% of viewport */}
        <div className="h-[95vh] flex items-center justify-center relative">
          <div className="text-center max-w-7xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 drop-shadow-lg">
              Production Management{' '}
              <RotatingText
                texts={['Simplified', 'Automated', 'Optimized', 'Coordinated']}
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
              Streamline your production workflow from initial brief to final delivery. 
              Connect clients, producers, and suppliers in one comprehensive platform.
            </p>
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
                  Automatically identify required assets from project descriptions with intelligent parsing
                </p>
              </div>
            </ScrollStackItem>

            <ScrollStackItem itemClassName="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200">
              <div className="flex flex-col items-center justify-center h-full">
                <Users className="h-12 w-12 sm:h-16 sm:w-16 text-teal-600 mb-3 sm:mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Supplier Network</h3>
                <p className="text-gray-700 text-center text-sm sm:text-base lg:text-lg">
                  Intelligent matching with relevant suppliers based on requirements and capabilities
                </p>
              </div>
            </ScrollStackItem>

            <ScrollStackItem itemClassName="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
              <div className="flex flex-col items-center justify-center h-full">
                <DollarSign className="h-12 w-12 sm:h-16 sm:w-16 text-green-600 mb-3 sm:mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Quote Management</h3>
                <p className="text-gray-700 text-center text-sm sm:text-base lg:text-lg">
                  Streamlined quote collection and comparison process for efficient decision making
                </p>
              </div>
            </ScrollStackItem>

            <ScrollStackItem itemClassName="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
              <div className="flex flex-col items-center justify-center h-full">
                <Clock className="h-12 w-12 sm:h-16 sm:w-16 text-orange-600 mb-3 sm:mb-4" />
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Real-time Tracking</h3>
                <p className="text-gray-700 text-center text-sm sm:text-base lg:text-lg">
                  Monitor project progress and status updates in real-time with comprehensive dashboards
                </p>
              </div>
            </ScrollStackItem>
          </ScrollStack>
        </div>

        {/* User Portals Section */}
        <div className="relative z-10 pt-4 sm:pt-8 pb-12 sm:pb-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-16">
              {/* Client Portal */}
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
                <div className="bg-blue-600 text-white p-4 sm:p-6">
                  <Package className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4" />
                  <h3 className="text-xl sm:text-2xl font-bold">Client Portal</h3>
                  <p className="opacity-90 mt-2 text-sm sm:text-base">Manage your projects</p>
                </div>
                <div className="p-4 sm:p-6">
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Project dashboard</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Create new projects</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Track project progress</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">View asset status</span>
                    </li>
                  </ul>
                  <Link
                    to="/client/dashboard"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center block"
                  >
                    Access Client Dashboard
                  </Link>
                </div>
              </div>
              {/* Producer Portal */}
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
                <div className="bg-teal-600 text-white p-4 sm:p-6">
                  <Package className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4" />
                  <h3 className="text-xl sm:text-2xl font-bold">Producer Portal</h3>
                  <p className="opacity-90 mt-2 text-sm sm:text-base">Manage projects and suppliers</p>
                </div>
                <div className="p-4 sm:p-6">
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Project oversight dashboard</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Asset management</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Supplier coordination</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Quote review and acceptance</span>
                    </li>
                  </ul>
                  <Link
                    to="/producer/dashboard"
                    className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors text-center block"
                  >
                    Access Producer Dashboard
                  </Link>
                </div>
              </div>

              {/* Supplier Portal */}
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
                <div className="bg-orange-600 text-white p-4 sm:p-6">
                  <Users className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4" />
                  <h3 className="text-xl sm:text-2xl font-bold">Supplier Portal</h3>
                  <p className="opacity-90 mt-2 text-sm sm:text-base">Receive and submit quotes</p>
                </div>
                <div className="p-4 sm:p-6">
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Email-based quote requests</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Simple quote submission</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">No login required</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Direct project access</span>
                    </li>
                  </ul>
                  <Link
                    to="/supplier/quotes"
                    className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors text-center block"
                  >
                    Access Supplier Dashboard
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
                Automated Production Workflow
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Brief Submission</h4>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Client submits project brief with requirements and parameters
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-teal-100 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl font-bold text-teal-600">2</span>
                  </div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Auto Processing</h4>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    System parses brief and automatically creates required assets
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-orange-100 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl font-bold text-orange-600">3</span>
                  </div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Supplier Matching</h4>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Relevant suppliers automatically receive quote requests via email
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl font-bold text-green-600">4</span>
                  </div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Quote Management</h4>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Producer reviews quotes and manages project through to completion
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
                Ready to streamline your production process?
              </h3>
              <p className="text-base sm:text-lg text-white/90 mb-6 sm:mb-8 drop-shadow-md">
                Get started with ProdBay and transform your production workflow today
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
