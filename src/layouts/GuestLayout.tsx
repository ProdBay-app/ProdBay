import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import DarkVeil from '@/components/DarkVeil';
import Footer from '@/components/Footer';

/**
 * Guest Layout
 * Minimal layout for supplier portal (no navigation, no sidebar)
 * Simple header with branding and clean design
 */
const GuestLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Dark Veil Background */}
      <div className="fixed inset-0 w-full h-full z-0">
        <DarkVeil
          speed={0.04}
          hueShift={0}
          noiseIntensity={0}
          scanlineFrequency={1.8}
          scanlineIntensity={0.16}
          warpAmount={5}
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Simple Header */}
        <nav className="sticky top-0 bg-transparent backdrop-blur-sm shadow-sm z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link 
                to="/" 
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer"
                title="Go to Home"
              >
                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-300 drop-shadow-lg" />
                <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">WedBay</h1>
                <span className="text-sm opacity-75 text-white/90 drop-shadow-md">| Vendor Portal</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full py-8 px-4">
          <Outlet />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default GuestLayout;
