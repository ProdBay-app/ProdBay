import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, Check } from 'lucide-react';
import type { ContactPerson } from '@/lib/supabase';

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
        className="flex items-center space-x-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition-colors"
      >
        <User className="h-4 w-4 text-gray-300" />
        <span className="text-gray-200">
          Contact Roles
          {selectedRoles.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-teal-500/30 text-teal-200 rounded-full text-xs">
              {selectedRoles.length}
            </span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-white">Contact Roles</h4>
              <button
                onClick={handleSelectAll}
                className="text-xs text-teal-300 hover:text-teal-200 transition-colors"
              >
                {selectedRoles.length === availableRoles.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="space-y-1">
              {availableRoles.map((role) => (
                <label
                  key={role}
                  className="flex items-center space-x-2 p-2 hover:bg-white/20 rounded cursor-pointer transition-colors"
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
                        : 'border-white/30'
                    }`}>
                      {selectedRoles.includes(role) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-200">{role}</span>
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
