import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, Check } from 'lucide-react';
import type { ContactPerson } from '../../../lib/supabase';

interface RoleFilterProps {
  selectedRoles: string[];
  onRolesChange: (roles: string[]) => void;
  suppliers: Array<{ contact_persons: ContactPerson[] }>;
}

const RoleFilter: React.FC<RoleFilterProps> = ({
  selectedRoles,
  onRolesChange,
  suppliers
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extract unique roles from all suppliers' contact persons
  const availableRoles = React.useMemo(() => {
    const roleSet = new Set<string>();
    suppliers.forEach(supplier => {
      supplier.contact_persons?.forEach(person => {
        if (person.role && person.role.trim()) {
          roleSet.add(person.role.trim());
        }
      });
    });
    return Array.from(roleSet).sort();
  }, [suppliers]);

  const handleRoleToggle = (role: string) => {
    if (selectedRoles.includes(role)) {
      onRolesChange(selectedRoles.filter(r => r !== role));
    } else {
      onRolesChange([...selectedRoles, role]);
    }
  };

  const handleSelectAll = () => {
    if (selectedRoles.length === availableRoles.length) {
      onRolesChange([]);
    } else {
      onRolesChange([...availableRoles]);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (availableRoles.length === 0) {
    return null; // Don't show the filter if no roles are available
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
      >
        <User className="h-4 w-4 text-gray-500" />
        <span className="text-gray-700">
          Contact Roles
          {selectedRoles.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full text-xs">
              {selectedRoles.length}
            </span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Contact Roles</h4>
              <button
                onClick={handleSelectAll}
                className="text-xs text-teal-600 hover:text-teal-800"
              >
                {selectedRoles.length === availableRoles.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="space-y-1">
              {availableRoles.map((role) => (
                <label
                  key={role}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={() => handleRoleToggle(role)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                      selectedRoles.includes(role)
                        ? 'bg-teal-600 border-teal-600'
                        : 'border-gray-300'
                    }`}>
                      {selectedRoles.includes(role) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-700">{role}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleFilter;
