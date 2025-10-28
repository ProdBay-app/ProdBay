import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';

interface ProjectCreationLoadingOverlayProps {
  isVisible: boolean;
}

/**
 * ProjectCreationLoadingOverlay - Full-screen loading overlay for project creation
 * 
 * This component provides visual feedback during the project creation process,
 * which includes both Supabase project creation and Railway API brief processing.
 * 
 * Features:
 * - Full-screen backdrop with high z-index
 * - Animated spinner with brand colors
 * - Randomly selected encouraging taglines
 * - Prevents user interaction during loading
 */
const ProjectCreationLoadingOverlay: React.FC<ProjectCreationLoadingOverlayProps> = ({ isVisible }) => {
  // Array of encouraging taglines to display during project creation
  const taglines = [
    "Crafting your project masterpiece...",
    "Summoning the creative spirits...",
    "Building something amazing...",
    "Channeling our inner genius...",
    "Creating magic in progress...",
    "Assembling your dream project...",
    "Brewing up something special...",
    "Weaving project wonders...",
    "Conjuring up excellence...",
    "Engineering your success...",
    "Sculpting your vision...",
    "Orchestrating perfection...",
    "Cultivating greatness...",
    "Fashioning your future...",
    "Molding possibilities..."
  ];

  // Randomly select a tagline using useMemo to avoid re-selection on every render
  // This ensures the tagline stays consistent during the loading state
  const selectedTagline = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * taglines.length);
    return taglines[randomIndex];
  }, []); // Empty dependency array ensures it only runs once

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      aria-label="Creating project, please wait"
      role="dialog"
      aria-modal="true"
    >
      {/* Main loading container */}
      <div className="flex flex-col items-center justify-center space-y-6 p-8 bg-white rounded-2xl shadow-2xl max-w-md mx-4">
        {/* Animated spinner with brand colors */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute top-2 left-2 w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        </div>

        {/* Sparkles icon for extra visual appeal */}
        <div className="flex items-center space-x-2 text-teal-600">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-lg font-semibold">Creating Project</span>
          <Sparkles className="w-5 h-5 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Random tagline */}
        <div className="text-center">
          <p className="text-gray-600 text-sm leading-relaxed">
            {selectedTagline}
          </p>
        </div>

        {/* Progress indicator dots */}
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>

        {/* Subtle instruction */}
        <p className="text-xs text-gray-500 text-center">
          This may take a few moments while we process your brief...
        </p>
      </div>
    </div>
  );
};

export default ProjectCreationLoadingOverlay;
