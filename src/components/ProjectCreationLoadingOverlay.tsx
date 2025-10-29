import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle, Clock, Database, Cpu, FileText, Users, Zap, Target, Rocket } from 'lucide-react';

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
  // Current step state (0-9)
  const [currentStep, setCurrentStep] = useState(0);
  

  // 10 visual steps representing the project creation process
  const steps = [
    { icon: Database, text: "Initializing project database", color: "text-blue-600" },
    { icon: FileText, text: "Processing project brief", color: "text-purple-600" },
    { icon: Cpu, text: "Running AI analysis", color: "text-indigo-600" },
    { icon: Target, text: "Identifying key requirements", color: "text-pink-600" },
    { icon: Users, text: "Analyzing supplier capabilities", color: "text-green-600" },
    { icon: Zap, text: "Generating asset recommendations", color: "text-yellow-600" },
    { icon: Clock, text: "Calculating timelines", color: "text-orange-600" },
    { icon: Sparkles, text: "Optimizing resource allocation", color: "text-teal-600" },
    { icon: Rocket, text: "Finalizing project setup", color: "text-red-600" },
    { icon: CheckCircle, text: "Project creation complete!", color: "text-emerald-600" }
  ];


  // Step progression effect - advance every 5 seconds
  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0); // Reset step when overlay is hidden
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep(prevStep => {
        // If we're at the last step, stay there (don't loop)
        if (prevStep >= steps.length - 1) {
          return prevStep;
        }
        return prevStep + 1;
      });
    }, 5000); // 5 seconds per step

    return () => clearInterval(interval);
  }, [isVisible, steps.length]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  const currentStepData = steps[currentStep];
  const CurrentIcon = currentStepData.icon;
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      aria-label="Creating project, please wait"
      role="dialog"
      aria-modal="true"
    >
      {/* Main loading container */}
      <div className="flex flex-col items-center justify-center space-y-6 p-8 bg-white rounded-2xl shadow-2xl max-w-lg mx-4">
        {/* Current step icon with animation */}
        <div className="relative">
          <div className={`w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center transition-all duration-500 ${currentStepData.color}`}>
            <CurrentIcon className="w-10 h-10" />
          </div>
          {/* Pulsing ring around the icon */}
          <div className={`absolute inset-0 rounded-full border-2 ${currentStepData.color.replace('text-', 'border-')} animate-ping`} style={{ opacity: 0.3 }}></div>
        </div>

        {/* Step progress bar */}
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-teal-500 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Current step text */}
        <div className="text-center">
          <h3 className={`text-lg font-semibold ${currentStepData.color} mb-2`}>
            {currentStepData.text}
          </h3>
        </div>

        {/* Subtle instruction */}
        <p className="text-xs text-gray-500 text-center">
          {currentStep === steps.length - 1 
            ? "Almost done! Finalizing your project..." 
            : "This may take a few moments while we process your brief..."
          }
        </p>
      </div>
    </div>
  );
};

export default ProjectCreationLoadingOverlay;
