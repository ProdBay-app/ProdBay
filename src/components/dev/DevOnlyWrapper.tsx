import React, { ReactNode } from 'react';
import { isSupplierImpersonationEnabled } from '@/utils/devMode';

interface DevOnlyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wrapper component that only renders its children in development mode
 * 
 * This component uses environment detection to conditionally show
 * development-only features like supplier impersonation.
 */
const DevOnlyWrapper: React.FC<DevOnlyWrapperProps> = ({ 
  children, 
  fallback = null 
}) => {
  // Only render children if we're in development mode
  if (!isSupplierImpersonationEnabled()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default DevOnlyWrapper;
