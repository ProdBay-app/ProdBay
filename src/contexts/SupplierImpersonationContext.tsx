import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { Supplier } from '@/lib/supabase';

interface SupplierImpersonationContextType {
  // State
  isImpersonating: boolean;
  impersonatedSupplier: Supplier | null;
  availableSuppliers: Supplier[];
  loading: boolean;
  
  // Actions
  startImpersonation: (supplier: Supplier) => void;
  stopImpersonation: () => void;
  refreshSuppliers: () => Promise<void>;
}

const SupplierImpersonationContext = createContext<SupplierImpersonationContextType | undefined>(undefined);

interface SupplierImpersonationProviderProps {
  children: ReactNode;
}

export const SupplierImpersonationProvider: React.FC<SupplierImpersonationProviderProps> = ({ children }) => {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedSupplier, setImpersonatedSupplier] = useState<Supplier | null>(null);
  const [availableSuppliers, setAvailableSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  // Load suppliers on mount
  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('supplier_name');

      if (error) throw error;
      setAvailableSuppliers(data || []);
    } catch (err) {
      console.error('Failed to load suppliers for impersonation:', err);
      setAvailableSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const startImpersonation = (supplier: Supplier) => {
    setImpersonatedSupplier(supplier);
    setIsImpersonating(true);
    // Store in sessionStorage for persistence during development session
    sessionStorage.setItem('supplierImpersonation', JSON.stringify(supplier));
  };

  const stopImpersonation = () => {
    setImpersonatedSupplier(null);
    setIsImpersonating(false);
    sessionStorage.removeItem('supplierImpersonation');
  };

  const refreshSuppliers = async () => {
    await loadSuppliers();
  };

  // Restore impersonation state from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('supplierImpersonation');
    if (stored) {
      try {
        const supplier = JSON.parse(stored);
        setImpersonatedSupplier(supplier);
        setIsImpersonating(true);
      } catch (err) {
        console.error('Failed to restore impersonation state:', err);
        sessionStorage.removeItem('supplierImpersonation');
      }
    }
  }, []);

  const value: SupplierImpersonationContextType = {
    isImpersonating,
    impersonatedSupplier,
    availableSuppliers,
    loading,
    startImpersonation,
    stopImpersonation,
    refreshSuppliers,
  };

  return (
    <SupplierImpersonationContext.Provider value={value}>
      {children}
    </SupplierImpersonationContext.Provider>
  );
};

export const useSupplierImpersonation = (): SupplierImpersonationContextType => {
  const context = useContext(SupplierImpersonationContext);
  if (context === undefined) {
    throw new Error('useSupplierImpersonation must be used within a SupplierImpersonationProvider');
  }
  return context;
};
