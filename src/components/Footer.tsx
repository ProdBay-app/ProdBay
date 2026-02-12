import React from 'react';

interface FooterProps {
  variant?: 'dark' | 'light';
}

const Footer: React.FC<FooterProps> = ({ variant = 'dark' }) => {
  const currentYear = new Date().getFullYear();
  const isLight = variant === 'light';
  const textClass = isLight ? 'text-wedding-slate-muted hover:text-wedding-slate' : 'text-white/80 hover:text-white';
  const borderClass = isLight ? 'border-wedding-secondary' : 'border-white/20';

  return (
    <footer className={`bg-transparent backdrop-blur-sm shadow-sm border-t ${borderClass}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          {/* Copyright notice */}
          <div className={`text-sm ${textClass} drop-shadow-sm`}>
            © {currentYear} WedBay. All rights reserved.
          </div>
          
          {/* Legal links */}
          <div className="flex space-x-6">
            <a 
              href="#" 
              className={`text-sm ${textClass} transition-colors drop-shadow-sm`}
              onClick={(e) => e.preventDefault()}
            >
              Terms of Service
            </a>
            <a 
              href="#" 
              className={`text-sm ${textClass} transition-colors drop-shadow-sm`}
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
