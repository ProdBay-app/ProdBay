import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Users, 
  Building2, 
  ArrowRight, 
  CheckCircle,
  FileText, 
  DollarSign,
  Clock
} from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
            title="Go to Home"
          >
            <Package className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">ProdBay</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Production Management
            <span className="text-blue-600"> Simplified</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your production workflow from initial brief to final delivery. 
            Connect clients, producers, and suppliers in one comprehensive platform.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Smart Brief Parsing</h3>
            <p className="text-gray-600 text-sm">
              Automatically identify required assets from project descriptions
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <Users className="h-12 w-12 text-teal-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Supplier Network</h3>
            <p className="text-gray-600 text-sm">
              Intelligent matching with relevant suppliers based on requirements
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <DollarSign className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Quote Management</h3>
            <p className="text-gray-600 text-sm">
              Streamlined quote collection and comparison process
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <Clock className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Real-time Tracking</h3>
            <p className="text-gray-600 text-sm">
              Monitor project progress and status updates in real-time
            </p>
          </div>
        </div>

        {/* User Portals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Client Portal */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-blue-600 text-white p-6">
              <Building2 className="h-12 w-12 mb-4" />
              <h3 className="text-2xl font-bold">Client Portal</h3>
              <p className="opacity-90 mt-2">Submit projects and track progress</p>
            </div>
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700">Submit project briefs</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700">Real-time project dashboard</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700">Cost and timeline visibility</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-gray-700">Producer communication</span>
                </li>
              </ul>
              <Link
                to="/client/new"
                className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>Start New Project</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Producer Portal */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-teal-600 text-white p-6">
              <Package className="h-12 w-12 mb-4" />
              <h3 className="text-2xl font-bold">Producer Portal</h3>
              <p className="opacity-90 mt-2">Manage projects and suppliers</p>
            </div>
            <div className="p-6">
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
                className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <span>Access Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Supplier Portal */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-orange-600 text-white p-6">
              <Users className="h-12 w-12 mb-4" />
              <h3 className="text-2xl font-bold">Supplier Portal</h3>
              <p className="opacity-90 mt-2">Receive and submit quotes</p>
            </div>
            <div className="p-6">
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
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <p className="text-gray-600 text-sm">
                  Suppliers receive email invitations with unique quote submission links
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Automated Production Workflow
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold mb-2">Brief Submission</h4>
              <p className="text-gray-600 text-sm">
                Client submits project brief with requirements and parameters
              </p>
            </div>

            <div className="text-center">
              <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-teal-600">2</span>
              </div>
              <h4 className="font-semibold mb-2">Auto Processing</h4>
              <p className="text-gray-600 text-sm">
                System parses brief and automatically creates required assets
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">3</span>
              </div>
              <h4 className="font-semibold mb-2">Supplier Matching</h4>
              <p className="text-gray-600 text-sm">
                Relevant suppliers automatically receive quote requests via email
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">4</span>
              </div>
              <h4 className="font-semibold mb-2">Quote Management</h4>
              <p className="text-gray-600 text-sm">
                Producer reviews quotes and manages project through to completion
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to streamline your production process?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Choose your role to get started with ProdBay today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/client/new"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start as Client
            </Link>
            <Link
              to="/producer/dashboard"
              className="px-8 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              Access Producer Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;