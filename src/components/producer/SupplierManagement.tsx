import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Supplier } from '../../lib/supabase';
import { Users, Mail, Plus, Tag, Edit, Trash2 } from 'lucide-react';
import { ErrorMessage, SuccessMessage } from '../../utils/ui';

const SupplierManagement: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    supplier_name: '',
    contact_email: '',
    service_categories: [] as string[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const availableCategories = [
    'Printing', 'Graphics', 'Banners', 'Staging', 'Audio', 'Lighting',
    'Catering', 'Food', 'Beverages', 'Design', 'Branding', 'Marketing',
    'Transport', 'Logistics', 'Delivery', 'Photography', 'Video', 'Security'
  ];

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('supplier_name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSupplier) {
        // Update existing supplier
        const { error } = await supabase
          .from('suppliers')
          .update(formData)
          .eq('id', editingSupplier.id);

        if (error) throw error;
        setEditingSupplier(null);
      } else {
        // Create new supplier
        const { error } = await supabase
          .from('suppliers')
          .insert(formData);

        if (error) throw error;
        setShowAddForm(false);
      }

      // Reset form
      setFormData({
        supplier_name: '',
        contact_email: '',
        service_categories: []
      });

      await loadSuppliers();
      setSuccess(editingSupplier ? 'Supplier updated successfully!' : 'Supplier added successfully!');
      setError(null);
    } catch (error) {
      console.error('Error saving supplier:', error);
      setError('Failed to save supplier');
      setSuccess(null);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setFormData({
      supplier_name: supplier.supplier_name,
      contact_email: supplier.contact_email,
      service_categories: supplier.service_categories
    });
    setEditingSupplier(supplier);
    setShowAddForm(true);
  };

  const handleDelete = async (supplierId: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId);

      if (error) throw error;
      await loadSuppliers();
      setSuccess('Supplier deleted successfully!');
      setError(null);
    } catch (error) {
      console.error('Error deleting supplier:', error);
      setError('Failed to delete supplier');
      setSuccess(null);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      service_categories: prev.service_categories.includes(category)
        ? prev.service_categories.filter(c => c !== category)
        : [...prev.service_categories, category]
    }));
  };

  const cancelEdit = () => {
    setShowAddForm(false);
    setEditingSupplier(null);
    setFormData({
      supplier_name: '',
      contact_email: '',
      service_categories: []
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={error} className="mb-4" />}
      {success && <SuccessMessage message={success} className="mb-4" />}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supplier Management</h1>
          <p className="text-gray-600 mt-1">Manage your supplier network and categories</p>
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
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </h2>
            <button
              onClick={cancelEdit}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="supplier_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  id="supplier_name"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email *
                </label>
                <input
                  type="email"
                  id="contact_email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        ? 'bg-teal-100 border-teal-300 text-teal-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Suppliers List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-teal-600" />
            <h2 className="text-xl font-semibold">Active Suppliers ({suppliers.length})</h2>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {supplier.supplier_name}
                    </h3>
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{supplier.contact_email}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <div className="flex flex-wrap gap-1">
                      {supplier.service_categories.map((category) => (
                        <span
                          key={category}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
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
                    className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded"
                    title="Edit Supplier"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(supplier.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete Supplier"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {suppliers.length === 0 && (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers yet</h3>
            <p className="text-gray-600 mb-4">Add your first supplier to start managing your network</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Add First Supplier
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierManagement;