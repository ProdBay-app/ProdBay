import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Tag, Trash2, X } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { SupplierService, type CreateSupplierData } from '@/services/supplierService';
import type { ContactPerson, Supplier } from '@/lib/supabase';

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
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([]);
  const [cityInput, setCityInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(initialData?.id);

  useEscapeKey(isOpen, onClose, isSubmitting);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      const normalizedContacts = (initialData.contact_persons ?? []).map((person) => ({
        ...person,
        default_cc: Boolean(person.default_cc ?? person.is_cc),
        default_bcc: Boolean(person.default_bcc ?? person.is_bcc)
      }));

      setFormState({
        supplier_name: initialData.supplier_name ?? '',
        contact_email: initialData.contact_email ?? '',
        service_categories: initialData.service_categories ?? [],
        address: initialData.address ?? '',
        cities_served: initialData.cities_served ?? []
      });
      setContactPersons(normalizedContacts);
      setCityInput('');
      return;
    }

    setFormState(INITIAL_FORM_STATE);
    setContactPersons([]);
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

  const addContactPerson = () => {
    setContactPersons((prev) => [
      ...prev,
      {
        name: '',
        email: '',
        phone: '',
        role: '',
        is_primary: prev.length === 0,
        default_cc: false,
        default_bcc: false
      }
    ]);
  };

  const removeContactPerson = (indexToRemove: number) => {
    setContactPersons((prev) => {
      const updated = prev.filter((_, index) => index !== indexToRemove);
      const hasPrimary = updated.some((person) => person.is_primary);
      if (updated.length > 0 && !hasPrimary) {
        updated[0] = { ...updated[0], is_primary: true };
        setFormState((state) => ({
          ...state,
          contact_email: updated[0].email ?? ''
        }));
      }
      return updated;
    });
  };

  const updateContactPerson = (
    indexToUpdate: number,
    field: keyof ContactPerson,
    value: string | boolean
  ) => {
    setContactPersons((prev) => {
      return prev.map((person, index) => {
        if (index !== indexToUpdate) return person;

        if (field === 'is_cc') {
          return {
            ...person,
            default_cc: Boolean(value),
            default_bcc: value ? false : person.default_bcc
          };
        }

        if (field === 'is_bcc') {
          return {
            ...person,
            default_bcc: Boolean(value),
            default_cc: value ? false : person.default_cc
          };
        }

        return { ...person, [field]: value };
      });
    });
  };

  const setPrimaryContact = (indexToSet: number) => {
    setContactPersons((prev) => {
      const updated = prev.map((person, index) => ({
        ...person,
        is_primary: index === indexToSet
      }));
      const primaryEmail = updated[indexToSet]?.email?.trim() ?? '';
      setFormState((state) => ({
        ...state,
        contact_email: primaryEmail
      }));
      return updated;
    });
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
        cities_served: formState.cities_served,
        contact_persons: contactPersons
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
              {isEditing ? 'Edit Vendor' : 'Add New Vendor'}
            </h2>
            <p className="text-sm text-gray-300 mt-1">
              {isEditing ? 'Update vendor details and coverage areas.' : 'Create a vendor profile with coverage areas.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Close vendor form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form id="supplier-form-modal" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="supplier_name" className="block text-sm font-medium text-gray-200 mb-1">
                Vendor Name *
              </label>
              <input
                id="supplier_name"
                type="text"
                required
                value={formState.supplier_name}
                onChange={(e) => setFormState(prev => ({ ...prev, supplier_name: e.target.value }))}
                className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-wedding-primary focus:border-transparent"
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
                placeholder="vendor@example.com"
                className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-wedding-primary focus:border-transparent"
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
              className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-wedding-primary focus:border-transparent"
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
              className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-wedding-primary focus:border-transparent"
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-200">Contact Persons</h3>
              <button
                type="button"
                onClick={addContactPerson}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-wedding-primary/30 text-wedding-primary-light rounded-lg hover:bg-wedding-primary/40 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Contact</span>
              </button>
            </div>

            {contactPersons.length === 0 ? (
              <div className="text-sm text-gray-300 py-3">
                No contacts yet. Add contact people like billing or operations.
              </div>
            ) : (
              <div className="space-y-3">
                {contactPersons.map((person, index) => (
                  <div key={index} className="border border-white/20 rounded-lg p-4 bg-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Name</label>
                        <input
                          type="text"
                          value={person.name}
                          onChange={(e) => updateContactPerson(index, 'name', e.target.value)}
                          placeholder="Contact name"
                          className="w-full px-3 py-2 text-sm bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-wedding-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Email</label>
                        <input
                          type="email"
                          value={person.email}
                          onChange={(e) => {
                            const nextEmail = e.target.value;
                            updateContactPerson(index, 'email', nextEmail);
                            if (person.is_primary) {
                              setFormState((prev) => ({
                                ...prev,
                                contact_email: nextEmail
                              }));
                            }
                          }}
                          placeholder="contact@vendor.com"
                          className="w-full px-3 py-2 text-sm bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-wedding-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Phone</label>
                        <input
                          type="text"
                          value={person.phone ?? ''}
                          onChange={(e) => updateContactPerson(index, 'phone', e.target.value)}
                          placeholder="+1-555-0123"
                          className="w-full px-3 py-2 text-sm bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-wedding-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Role</label>
                        <input
                          type="text"
                          value={person.role}
                          onChange={(e) => updateContactPerson(index, 'role', e.target.value)}
                          placeholder="Billing, Sales, Operations"
                          className="w-full px-3 py-2 text-sm bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-wedding-primary focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <label className="inline-flex items-center gap-2 text-xs text-gray-200">
                        <input
                          type="radio"
                          name="primary_contact"
                          checked={Boolean(person.is_primary)}
                          onChange={() => setPrimaryContact(index)}
                          className="h-4 w-4 text-wedding-primary-light border-white/30 bg-black/20 focus:ring-wedding-primary"
                        />
                        <span>Primary contact</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeContactPerson(index)}
                        className="inline-flex items-center gap-1 text-xs text-red-300 hover:text-red-200"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </div>

                    {!person.is_primary && (
                      <div className="mt-3 border-t border-white/10 pt-3">
                        <p className="text-xs font-medium text-gray-300 mb-2">Communication Options</p>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-200">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={Boolean(person.default_cc)}
                              onChange={(e) => updateContactPerson(index, 'is_cc', e.target.checked)}
                              className="h-4 w-4 rounded border-white/30 bg-black/20 text-wedding-primary-light focus:ring-wedding-primary"
                            />
                            <span>Always CC on Quote Requests</span>
                          </label>
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={Boolean(person.default_bcc)}
                              onChange={(e) => updateContactPerson(index, 'is_bcc', e.target.checked)}
                              className="h-4 w-4 rounded border-white/30 bg-black/20 text-wedding-primary-light focus:ring-wedding-primary"
                            />
                            <span>Always BCC on Quote Requests</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
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
                      ? 'bg-wedding-primary/30 border-wedding-primary-light/50 text-wedding-primary-light'
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
            className="px-4 py-2 bg-wedding-primary text-white rounded-lg hover:bg-wedding-primary-hover transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Vendor' : 'Add Vendor'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierFormModal;
