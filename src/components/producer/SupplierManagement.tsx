import React, { useMemo, useState } from 'react';
import { Users, Mail, Plus, Tag, Edit, Trash2, User, Phone, Star } from 'lucide-react';
import SupplierFilters from './supplier-filters/SupplierFilters';
import SupplierFormModal from './SupplierFormModal';
import { useSupplierManagement } from '@/hooks/useSupplierManagement';
import type { Supplier } from '@/lib/supabase';
import { getSupplierPrimaryEmail } from '@/utils/supplierUtils';

const SupplierManagement: React.FC = () => {
  const {
    // Data state
    suppliers,
    loading,
    
    // Filter state
    filters,
    
    // Computed state
    filteredSuppliers,
    filterStats,
    
    // Constants
    availableCategories,
    
    // Data operations
    loadSuppliers,
    handleDelete,
    
    // Filter management
    setFilters,
    clearAllFilters
  } = useSupplierManagement();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');

  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    suppliers.forEach((supplier) => {
      supplier.cities_served?.forEach((city) => cities.add(city));
    });
    return Array.from(cities).sort();
  }, [suppliers]);

  const cityFilteredSuppliers = useMemo(() => {
    return filteredSuppliers.filter((supplier) => {
      if (selectedCity && !supplier.cities_served?.includes(selectedCity)) {
        return false;
      }
      return true;
    });
  }, [filteredSuppliers, selectedCity]);

  const handleAdd = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleModalSuccess = async () => {
    await loadSuppliers();
    setSelectedSupplier(null);
    setIsModalOpen(false);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wedding-primary-light"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Vendor Management</h1>
          <p className="text-gray-200 mt-1">Manage your vendor network and service categories</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-wedding-primary text-white rounded-lg hover:bg-wedding-primary-hover"
        >
          <Plus className="h-4 w-4" />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* Filters */}
      <SupplierFilters
        filters={filters}
        onFiltersChange={setFilters}
        suppliers={suppliers}
        availableCategories={availableCategories}
        selectedCity={selectedCity}
        onSelectedCityChange={setSelectedCity}
        availableCities={availableCities}
      />

      {/* Suppliers List */}
      <div className="relative z-0 bg-white/10 backdrop-blur-md rounded-lg shadow-lg">
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-wedding-primary-light" />
              <h2 className="text-xl font-semibold text-white">
                Active Vendors
                {filterStats.isFiltered || Boolean(selectedCity) ? (
                  <span className="text-gray-200 font-normal">
                    {' '}({cityFilteredSuppliers.length} of {filterStats.totalSuppliers})
                  </span>
                ) : (
                  <span className="text-gray-200 font-normal">
                    {' '}({filterStats.totalSuppliers})
                  </span>
                )}
              </h2>
            </div>
            {(filterStats.isFiltered || Boolean(selectedCity)) && (
              <div className="text-sm text-gray-300">
                {cityFilteredSuppliers.length === 0 ? 'No vendors match your filters' : 'Filtered results'}
              </div>
            )}
          </div>
        </div>

        <div className="divide-y divide-white/10">
          {cityFilteredSuppliers.map((supplier) => {
            const primaryEmail = getSupplierPrimaryEmail(supplier);

            return (
              <div
                key={supplier.id}
                onClick={() => handleEdit(supplier)}
                className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-white">
                        {supplier.supplier_name}
                      </h3>
                      {primaryEmail && (
                        <div className="flex items-center space-x-1 text-gray-300">
                          <Mail className="h-4 w-4" />
                          <a
                            href={`mailto:${primaryEmail}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm hover:text-white underline underline-offset-2"
                          >
                            {primaryEmail}
                          </a>
                        </div>
                      )}
                    </div>

                  {/* Contact Persons Display */}
                  {supplier.contact_persons && supplier.contact_persons.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="h-4 w-4 text-gray-300" />
                        <span className="text-sm font-medium text-gray-200">Contact Persons:</span>
                      </div>
                      <div className="space-y-1">
                        {supplier.contact_persons.map((person, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3 text-gray-300" />
                              <span className="text-gray-200">{person.name}</span>
                              {person.role && (
                                <span className="text-gray-300">({person.role})</span>
                              )}
                              {person.is_primary && (
                                <div className="flex items-center space-x-1 px-1 py-0.5 bg-yellow-500/30 text-yellow-200 rounded text-xs">
                                  <Star className="h-2 w-2" />
                                  <span>Primary</span>
                                </div>
                              )}
                            </div>
                            {person.phone && (
                              <div className="flex items-center space-x-1 text-gray-300">
                                <Phone className="h-3 w-3" />
                                <span>{person.phone}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4 text-gray-300" />
                    <div className="flex flex-wrap gap-1">
                      {supplier.service_categories.map((category) => (
                        <span
                          key={category}
                          className="px-2 py-1 bg-white/20 text-gray-200 text-xs rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(supplier);
                      }}
                      className="p-2 text-gray-300 hover:text-wedding-primary-light hover:bg-wedding-primary/20 rounded transition-colors"
                      title="Edit Vendor"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(supplier.id);
                      }}
                      className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-500/20 rounded transition-colors"
                      title="Delete Vendor"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {cityFilteredSuppliers.length === 0 && (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            {suppliers.length === 0 ? (
              <>
                <h3 className="text-lg font-medium text-white mb-2">No vendors yet</h3>
                <p className="text-gray-200 mb-4">Add your first vendor to start building your network</p>
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-wedding-primary text-white rounded-lg hover:bg-wedding-primary-hover transition-colors"
                >
                  Add First Vendor
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-white mb-2">No vendors match your filters</h3>
                <p className="text-gray-200 mb-4">
                  Try adjusting your search criteria or clearing some filters
                </p>
                <button
                  onClick={() => {
                    clearAllFilters();
                    setSelectedCity('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Clear All Filters
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <SupplierFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSupplier(null);
        }}
        initialData={selectedSupplier}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default SupplierManagement;