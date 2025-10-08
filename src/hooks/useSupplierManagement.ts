import { useState, useEffect, useMemo } from 'react';
import type { Supplier, ContactPerson } from '@/lib/supabase';
import { useNotification } from './useNotification';
import { SupplierService } from '@/services/supplierService';
import { filterSuppliers, getFilterStats, debounce } from '@/utils/supplierFiltering';
import type { FilterState } from '@/components/producer/supplier-filters/SupplierFilters';

export interface SupplierFormData {
  supplier_name: string;
  contact_email: string;
  service_categories: string[];
  contact_persons: ContactPerson[];
}

export interface UseSupplierManagementReturn {
  // Data state
  suppliers: Supplier[];
  loading: boolean;
  
  // Form state
  showAddForm: boolean;
  editingSupplier: Supplier | null;
  formData: SupplierFormData;
  
  // Filter state
  filters: FilterState;
  
  // Computed state
  filteredSuppliers: Supplier[];
  filterStats: ReturnType<typeof getFilterStats>;
  debouncedSetFilters: (newFilters: FilterState) => void;
  
  // Constants
  availableCategories: string[];
  
  // Data operations
  loadSuppliers: () => Promise<void>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleDelete: (supplierId: string) => Promise<void>;
  
  // Form management
  handleEdit: (supplier: Supplier) => void;
  cancelEdit: () => void;
  setShowAddForm: (show: boolean) => void;
  updateFormData: (field: keyof SupplierFormData, value: string | string[] | ContactPerson[]) => void;
  
  // Category management
  handleCategoryToggle: (category: string) => void;
  
  // Contact person management
  addContactPerson: () => void;
  removeContactPerson: (index: number) => void;
  updateContactPerson: (index: number, field: keyof ContactPerson, value: string | boolean) => void;
  setPrimaryContact: (index: number) => void;
  
  // Filter management
  setFilters: (filters: FilterState) => void;
  clearAllFilters: () => void;
}

const AVAILABLE_CATEGORIES = [
  'Printing', 'Graphics', 'Banners', 'Staging', 'Audio', 'Lighting',
  'Catering', 'Food', 'Beverages', 'Design', 'Branding', 'Marketing',
  'Transport', 'Logistics', 'Delivery', 'Photography', 'Video', 'Security'
];

const INITIAL_FORM_DATA: SupplierFormData = {
  supplier_name: '',
  contact_email: '',
  service_categories: [],
  contact_persons: []
};

const INITIAL_FILTERS: FilterState = {
  searchTerm: '',
  selectedCategories: [],
  selectedRoles: [],
  hasContactPersons: null,
  dateRange: { start: null, end: null }
};

export const useSupplierManagement = (): UseSupplierManagementReturn => {
  const { showSuccess, showError, showConfirm } = useNotification();
  
  // Core data state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(INITIAL_FORM_DATA);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  
  // Computed state
  const filteredSuppliers = useMemo(() => {
    return filterSuppliers(suppliers, filters);
  }, [suppliers, filters]);
  
  const filterStats = useMemo(() => {
    return getFilterStats(suppliers, filteredSuppliers, filters);
  }, [suppliers, filteredSuppliers, filters]);
  
  const debouncedSetFilters = useMemo(
    () => debounce((newFilters: FilterState) => setFilters(newFilters), 300),
    []
  );
  
  // Load suppliers on mount
  useEffect(() => {
    loadSuppliers();
  }, []);
  
  // Data operations
  const loadSuppliers = async (): Promise<void> => {
    try {
      const data = await SupplierService.getAllSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      showError('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    try {
      if (editingSupplier) {
        // Update existing supplier
        await SupplierService.updateSupplier(editingSupplier.id, formData);
        setEditingSupplier(null);
      } else {
        // Create new supplier
        await SupplierService.createSupplier(formData);
        setShowAddForm(false);
      }
      
      // Reset form
      setFormData(INITIAL_FORM_DATA);
      
      await loadSuppliers();
      showSuccess(editingSupplier ? 'Supplier updated successfully' : 'Supplier added successfully');
    } catch (error) {
      console.error('Error saving supplier:', error);
      showError('Failed to save supplier');
    }
  };
  
  const handleDelete = async (supplierId: string): Promise<void> => {
    const confirmed = await showConfirm({
      title: 'Delete Supplier',
      message: 'Are you sure you want to delete this supplier?',
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    
    if (!confirmed) return;
    
    try {
      await SupplierService.deleteSupplier(supplierId);
      await loadSuppliers();
      showSuccess('Supplier deleted successfully');
    } catch (error) {
      console.error('Error deleting supplier:', error);
      showError('Failed to delete supplier');
    }
  };
  
  // Form management
  const handleEdit = (supplier: Supplier): void => {
    setFormData({
      supplier_name: supplier.supplier_name,
      contact_email: supplier.contact_email,
      service_categories: supplier.service_categories,
      contact_persons: supplier.contact_persons || []
    });
    setEditingSupplier(supplier);
    setShowAddForm(true);
  };
  
  const cancelEdit = (): void => {
    setShowAddForm(false);
    setEditingSupplier(null);
    setFormData(INITIAL_FORM_DATA);
  };
  
  const updateFormData = (field: keyof SupplierFormData, value: string | string[] | ContactPerson[]): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Category management
  const handleCategoryToggle = (category: string): void => {
    setFormData(prev => ({
      ...prev,
      service_categories: prev.service_categories.includes(category)
        ? prev.service_categories.filter(c => c !== category)
        : [...prev.service_categories, category]
    }));
  };
  
  // Contact person management
  const addContactPerson = (): void => {
    setFormData(prev => ({
      ...prev,
      contact_persons: [...prev.contact_persons, {
        name: '',
        email: '',
        role: '',
        phone: '',
        is_primary: prev.contact_persons.length === 0 // First contact person is primary by default
      }]
    }));
  };
  
  const removeContactPerson = (index: number): void => {
    setFormData(prev => ({
      ...prev,
      contact_persons: prev.contact_persons.filter((_, i) => i !== index)
    }));
  };
  
  const updateContactPerson = (index: number, field: keyof ContactPerson, value: string | boolean): void => {
    setFormData(prev => ({
      ...prev,
      contact_persons: prev.contact_persons.map((person, i) => 
        i === index ? { ...person, [field]: value } : person
      )
    }));
  };
  
  const setPrimaryContact = (index: number): void => {
    setFormData(prev => ({
      ...prev,
      contact_persons: prev.contact_persons.map((person, i) => ({
        ...person,
        is_primary: i === index
      }))
    }));
  };
  
  // Filter management
  const clearAllFilters = (): void => {
    setFilters(INITIAL_FILTERS);
  };
  
  return {
    // Data state
    suppliers,
    loading,
    
    // Form state
    showAddForm,
    editingSupplier,
    formData,
    
    // Filter state
    filters,
    
    // Computed state
    filteredSuppliers,
    filterStats,
    debouncedSetFilters,
    
    // Constants
    availableCategories: AVAILABLE_CATEGORIES,
    
    // Data operations
    loadSuppliers,
    handleSubmit,
    handleDelete,
    
    // Form management
    handleEdit,
    cancelEdit,
    setShowAddForm,
    updateFormData,
    
    // Category management
    handleCategoryToggle,
    
    // Contact person management
    addContactPerson,
    removeContactPerson,
    updateContactPerson,
    setPrimaryContact,
    
    // Filter management
    setFilters,
    clearAllFilters
  };
};
