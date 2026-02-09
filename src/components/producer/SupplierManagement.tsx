import React from 'react';
import { Users, Mail, Plus, Tag, Edit, Trash2, User, Phone, Star } from 'lucide-react';
import SupplierFilters from './supplier-filters/SupplierFilters';
import { useSupplierManagement } from '@/hooks/useSupplierManagement';
import { getSupplierPrimaryEmail } from '@/utils/supplierUtils';

const SupplierManagement: React.FC = () => {
  const {
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
    availableCategories,
    
    // Data operations
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
  } = useSupplierManagement();


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Supplier Management</h1>
          <p className="text-gray-200 mt-1">Manage your supplier network and categories</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Add/Edit Supplier Form */}
      {showAddForm && (
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </h2>
            <button
              onClick={cancelEdit}
              className="text-gray-300 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div>
                <label htmlFor="supplier_name" className="block text-sm font-medium text-gray-200 mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  id="supplier_name"
                  value={formData.supplier_name}
                  onChange={(e) => updateFormData('supplier_name', e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Service Categories
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {availableCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryToggle(category)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      formData.service_categories.includes(category)
                        ? 'bg-teal-500/30 border-teal-400/50 text-teal-200'
                        : 'bg-white/10 border-white/20 text-gray-200 hover:bg-white/20'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-200">
                  Contact Person(s)
                </label>
                <button
                  type="button"
                  onClick={addContactPerson}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-teal-500/30 text-teal-200 rounded-lg hover:bg-teal-500/40 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Contact</span>
                </button>
              </div>
              
              {formData.contact_persons.length === 0 ? (
                <div className="text-center py-4 text-gray-300 text-sm">
                  No contact persons added yet. Click "Add Contact" to add one.
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.contact_persons.map((person, index) => (
                    <div key={index} className="border border-white/20 rounded-lg p-4 bg-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-300" />
                          <span className="text-sm font-medium text-gray-200">
                            Contact Person {index + 1}
                          </span>
                          {person.is_primary && (
                            <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-500/30 text-yellow-200 rounded-full text-xs">
                              <Star className="h-3 w-3" />
                              <span>Primary</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {!person.is_primary && (
                            <button
                              type="button"
                              onClick={() => setPrimaryContact(index)}
                              className="text-xs text-blue-300 hover:text-blue-200"
                            >
                              Set Primary
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeContactPerson(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1">
                            Name *
                          </label>
                          <input
                            type="text"
                            value={person.name}
                            onChange={(e) => updateContactPerson(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="Contact person name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1">
                            Email *
                          </label>
                          <input
                            type="email"
                            value={person.email}
                            onChange={(e) => updateContactPerson(index, 'email', e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="contact@supplier.com"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1">
                            Role
                          </label>
                          <input
                            type="text"
                            value={person.role}
                            onChange={(e) => updateContactPerson(index, 'role', e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="e.g., Sales Manager, Project Coordinator"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={person.phone || ''}
                            onChange={(e) => updateContactPerson(index, 'phone', e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="+1-555-0123"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-white/20">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 text-gray-200 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <SupplierFilters
        filters={filters}
        onFiltersChange={setFilters}
        suppliers={suppliers}
        availableCategories={availableCategories}
      />

      {/* Suppliers List */}
      <div className="relative z-0 bg-white/10 backdrop-blur-md rounded-lg shadow-lg">
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-teal-300" />
              <h2 className="text-xl font-semibold text-white">
                Active Suppliers
                {filterStats.isFiltered ? (
                  <span className="text-gray-200 font-normal">
                    {' '}({filterStats.filteredCount} of {filterStats.totalSuppliers})
                  </span>
                ) : (
                  <span className="text-gray-200 font-normal">
                    {' '}({filterStats.totalSuppliers})
                  </span>
                )}
              </h2>
            </div>
            {filterStats.isFiltered && (
              <div className="text-sm text-gray-300">
                {filterStats.filteredCount === 0 ? 'No suppliers match your filters' : 'Filtered results'}
              </div>
            )}
          </div>
        </div>

        <div className="divide-y divide-white/10">
          {filteredSuppliers.map((supplier) => {
            const primaryEmail = getSupplierPrimaryEmail(supplier);

            return (
              <div key={supplier.id} className="p-6 hover:bg-white/20 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-white">
                      {supplier.supplier_name}
                    </h3>
                    {primaryEmail && (
                    <div className="flex items-center space-x-1 text-gray-300">
                      <Mail className="h-4 w-4" />
                        <span className="text-sm">{primaryEmail}</span>
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
                    onClick={() => handleEdit(supplier)}
                    className="p-2 text-gray-300 hover:text-teal-300 hover:bg-teal-500/20 rounded transition-colors"
                    title="Edit Supplier"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(supplier.id)}
                    className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-500/20 rounded transition-colors"
                    title="Delete Supplier"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              </div>
            </div>
            );
          })}
        </div>

        {filteredSuppliers.length === 0 && (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            {suppliers.length === 0 ? (
              <>
                <h3 className="text-lg font-medium text-white mb-2">No suppliers yet</h3>
                <p className="text-gray-200 mb-4">Add your first supplier to start managing your network</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Add First Supplier
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-white mb-2">No suppliers match your filters</h3>
                <p className="text-gray-200 mb-4">
                  Try adjusting your search criteria or clearing some filters
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Clear All Filters
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierManagement;