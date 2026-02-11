import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Tag, Trash2, X } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { SupplierService, type CreateSupplierData } from '@/services/supplierService';
import type { Supplier } from '@/lib/supabase';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Supplier | null;
  onSuccess: () => void | Promise<void>;
}

const AVAILABLE_CATEGORIES = [
  'Printing', 'Graphics', 'Banners', 'Staging', 'Audio', 'Lighting',
  'Catering', 'Food', 'Beverages', 'Design', 'Branding', 'Marketing',
  'Transport', 'Logistics', 'Delivery', 'Photography', 'Video', 'Security',
  'Staffing', 'Hospitality', 'Technical Services', 'Medical', 'Floral', 'Furniture', 'IT Services'
];

interface SupplierFormState {
  supplier_name: string;
  contact_email: string;
  service_categories: string[];
  address: string;
  cities_served: string[];
}

const INITIAL_FORM_STATE: SupplierFormState = {
  supplier_name: '',
  contact_email: '',
  service_categories: [],
  address: '',
  cities_served: []
};

const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSuccess
}) => {
  const [formState, setFormState] = useState<SupplierFormState>(INITIAL_FORM_STATE);
  const [cityInput, setCityInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(initialData?.id);

  useEscapeKey(isOpen, onClose, isSubmitting);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormState({
        supplier_name: initialData.supplier_name ?? '',
        contact_email: initialData.contact_email ?? '',
        service_categories: initialData.service_categories ?? [],
        address: initialData.address ?? '',
        cities_served: initialData.cities_served ?? []
      });
      setCityInput('');
      return;
    }

    setFormState(INITIAL_FORM_STATE);
    setCityInput('');
  }, [initialData, isOpen]);

  const sortedCities = useMemo(() => {
    return [...formState.cities_served].sort((a, b) => a.localeCompare(b));
  }, [formState.cities_served]);

  if (!isOpen) return null;

  const toggleCategory = (category: string) => {
    setFormState(prev => ({
      ...prev,
      service_categories: prev.service_categories.includes(category)
        ? prev.service_categories.filter(existing => existing !== category)
        : [...prev.service_categories, category]
    }));
  };

  const addCity = (rawValue: string) => {
    const value = rawValue.trim();
    if (!value) return;

    setFormState(prev => {
      const alreadyExists = prev.cities_served.some(
        city => city.toLowerCase() === value.toLowerCase()
      );
      if (alreadyExists) return prev;

      return {
        ...prev,
        cities_served: [...prev.cities_served, value]
      };
    });
  };

  const removeCity = (cityToRemove: string) => {
    setFormState(prev => ({
      ...prev,
      cities_served: prev.cities_served.filter(city => city !== cityToRemove)
    }));
  };

  const handleCityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();

    addCity(cityInput);
    setCityInput('');
  };

  const handleCityBlur = () => {
    if (!cityInput.trim()) return;
    addCity(cityInput);
    setCityInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload: CreateSupplierData = {
        supplier_name: formState.supplier_name.trim(),
        contact_email: formState.contact_email.trim() || null,
        service_categories: formState.service_categories,
        address: formState.address.trim(),
        cities_served: formState.cities_served
      };

      if (initialData?.id) {
        await SupplierService.updateSupplier(initialData.id, payload);
      } else {
        await SupplierService.createSupplier(payload);
      }

      await Promise.resolve(onSuccess());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between p-6 border-b border-white/20">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {isEditing ? 'Edit Supplier' : 'Add New Supplier'}
            </h2>
            <p className="text-sm text-gray-300 mt-1">
              {isEditing ? 'Update supplier details and coverage areas.' : 'Create a supplier profile with coverage areas.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Close supplier form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form id="supplier-form-modal" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="supplier_name" className="block text-sm font-medium text-gray-200 mb-1">
                Supplier Name *
              </label>
              <input
                id="supplier_name"
                type="text"
                required
                value={formState.supplier_name}
                onChange={(e) => setFormState(prev => ({ ...prev, supplier_name: e.target.value }))}
                className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="contact_email" className="block text-sm font-medium text-gray-200 mb-1">
                Email
              </label>
              <input
                id="contact_email"
                type="email"
                value={formState.contact_email}
                onChange={(e) => setFormState(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="supplier@example.com"
                className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-200 mb-1">
              Address
            </label>
            <textarea
              id="address"
              rows={3}
              value={formState.address}
              onChange={(e) => setFormState(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Street, suburb, city, postcode"
              className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="cities_served" className="block text-sm font-medium text-gray-200 mb-1">
              Cities / Regions Served
            </label>
            <input
              id="cities_served"
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={handleCityKeyDown}
              onBlur={handleCityBlur}
              placeholder="Type a city/region and press Enter"
              className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            {sortedCities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {sortedCities.map(city => (
                  <span
                    key={city}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 text-gray-200 text-xs rounded-full"
                  >
                    <span>{city}</span>
                    <button
                      type="button"
                      onClick={() => removeCity(city)}
                      className="text-gray-300 hover:text-red-300"
                      aria-label={`Remove ${city}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Service Categories
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {AVAILABLE_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    formState.service_categories.includes(category)
                      ? 'bg-teal-500/30 border-teal-400/50 text-teal-200'
                      : 'bg-white/10 border-white/20 text-gray-200 hover:bg-white/20'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {formState.service_categories.includes(category) ? <Tag className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    <span>{category}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-3 p-6 border-t border-white/20">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-200 border border-white/20 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="supplier-form-modal"
            disabled={isSubmitting || !formState.supplier_name.trim()}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Supplier' : 'Add Supplier'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierFormModal;
