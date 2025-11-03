import React from 'react';

interface FooterProps {
  transparent?: boolean;
}

const Footer: React.FC<FooterProps> = ({ transparent = false }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={transparent 
      ? "bg-transparent backdrop-blur-sm border-t border-white/20" 
      : "bg-white border-t border-gray-200"
    }>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          {/* Copyright notice */}
          <div className={transparent 
            ? "text-sm text-white/80 drop-shadow-sm" 
            : "text-sm text-gray-500"
          }>
            © {currentYear} ProdBay. All rights reserved.
          </div>
          
          {/* Legal links */}
          <div className="flex space-x-6">
            <a 
              href="#" 
              className={transparent
                ? "text-sm text-white/80 hover:text-white transition-colors drop-shadow-sm"
                : "text-sm text-gray-500 hover:text-gray-700 transition-colors"
              }
              onClick={(e) => e.preventDefault()}
            >
              Terms of Service
            </a>
            <a 
              href="#" 
              className={transparent
                ? "text-sm text-white/80 hover:text-white transition-colors drop-shadow-sm"
                : "text-sm text-gray-500 hover:text-gray-700 transition-colors"
              }
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
