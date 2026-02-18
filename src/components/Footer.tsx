import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-transparent backdrop-blur-sm shadow-sm border-t border-white/20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          {/* Copyright notice */}
          <div className="text-sm text-white/80 drop-shadow-sm">
            © {currentYear} ProdBay. All rights reserved.
          </div>
          
          {/* Footer links */}
          <div className="flex space-x-6">
            <Link
              to="/releases"
              className="text-sm text-white/80 hover:text-white transition-colors drop-shadow-sm"
            >
              Release Notes
            </Link>
            <a 
              href="#" 
              className="text-sm text-white/80 hover:text-white transition-colors drop-shadow-sm"
              onClick={(e) => e.preventDefault()}
            >
              Terms of Service
            </a>
            <a 
              href="#" 
              className="text-sm text-white/80 hover:text-white transition-colors drop-shadow-sm"
              onClick={(e) => e.preventDefault()}
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
