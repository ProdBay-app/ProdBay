import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Tag, Check } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  availableCategories: string[];
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategories,
  onCategoriesChange,
  availableCategories
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Group categories by type
  const categoryGroups = {
    'Production': ['Printing', 'Graphics', 'Banners', 'Staging', 'Audio', 'Lighting'],
    'Catering': ['Catering', 'Food', 'Beverages'],
    'Creative': ['Design', 'Branding', 'Marketing'],
    'Media': ['Photography', 'Video'],
    'Logistics': ['Transport', 'Logistics', 'Delivery'],
    'Security': ['Security']
  };

  // Filter groups to only show categories that exist in availableCategories
  const filteredGroups = Object.entries(categoryGroups).map(([groupName, categories]) => [
    groupName,
    categories.filter(cat => availableCategories.includes(cat))
  ]).filter(([, categories]) => (categories as string[]).length > 0) as [string, string[]][];

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  const handleSelectAll = (categories: string[]) => {
    const allSelected = categories.every(cat => selectedCategories.includes(cat));
    if (allSelected) {
      // Deselect all categories in this group
      onCategoriesChange(selectedCategories.filter(cat => !categories.includes(cat)));
    } else {
      // Select all categories in this group
      const newCategories = [...selectedCategories];
      categories.forEach(cat => {
        if (!newCategories.includes(cat)) {
          newCategories.push(cat);
        }
      });
      onCategoriesChange(newCategories);
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition-colors md:cursor-pointer"
      >
        <Tag className="h-4 w-4 text-gray-300" />
        <span className="text-gray-200">
          Categories
          {selectedCategories.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-teal-500/30 text-teal-200 rounded-full text-xs">
              {selectedCategories.length}
            </span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-gray-900 border border-white/20 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-4 space-y-4">
            {filteredGroups.map(([groupName, categories]) => {
              const allSelected = categories.every(cat => selectedCategories.includes(cat));
              
              return (
                <div key={groupName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">{groupName}</h4>
                    <button
                      onClick={() => handleSelectAll(categories)}
                      className="text-xs text-teal-300 hover:text-teal-200 transition-colors"
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {categories.map((category) => (
                      <label
                        key={category}
                        className="flex items-center space-x-2 p-2 hover:bg-white/20 rounded cursor-pointer transition-colors"
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category)}
                            onChange={() => handleCategoryToggle(category)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                            selectedCategories.includes(category)
                              ? 'bg-teal-600 border-teal-600'
                              : 'border-white/30'
                          }`}>
                            {selectedCategories.includes(category) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-200">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;
