/**
 * Asset Tag Management System
 * Provides predefined tags with unique colors for asset categorization
 */

export interface AssetTag {
  name: string;
  color: string;
  description: string;
}

// Predefined asset tags with unique colors
export const PREDEFINED_ASSET_TAGS: AssetTag[] = [
  {
    name: 'Design',
    color: '#8B5CF6', // Purple
    description: 'Visual design assets like graphics, layouts, and branding'
  },
  {
    name: 'Print',
    color: '#EF4444', // Red
    description: 'Print materials like brochures, flyers, and business cards'
  },
  {
    name: 'Digital',
    color: '#3B82F6', // Blue
    description: 'Digital assets like websites, apps, and online content'
  },
  {
    name: 'Video',
    color: '#F59E0B', // Amber
    description: 'Video content like promotional videos and animations'
  },
  {
    name: 'Photography',
    color: '#10B981', // Emerald
    description: 'Photography services and image assets'
  },
  {
    name: 'Writing',
    color: '#6B7280', // Gray
    description: 'Written content like copy, articles, and documentation'
  },
  {
    name: 'Marketing',
    color: '#EC4899', // Pink
    description: 'Marketing materials and promotional content'
  },
  {
    name: 'Event',
    color: '#F97316', // Orange
    description: 'Event-related assets like signage and displays'
  },
  {
    name: 'Packaging',
    color: '#84CC16', // Lime
    description: 'Product packaging and labeling'
  },
  {
    name: 'Signage',
    color: '#06B6D4', // Cyan
    description: 'Signage and wayfinding materials'
  },
  {
    name: 'Exhibition',
    color: '#8B5A2B', // Brown
    description: 'Exhibition and trade show materials'
  },
  {
    name: 'Social Media',
    color: '#6366F1', // Indigo
    description: 'Social media content and graphics'
  }
];

// Get tag by name
export const getTagByName = (name: string): AssetTag | undefined => {
  return PREDEFINED_ASSET_TAGS.find(tag => tag.name.toLowerCase() === name.toLowerCase());
};

// Get tag color by name
export const getTagColor = (name: string): string => {
  const tag = getTagByName(name);
  return tag?.color || '#6B7280'; // Default gray color
};

// Get all available tag names
export const getAvailableTagNames = (): string[] => {
  return PREDEFINED_ASSET_TAGS.map(tag => tag.name);
};

// Validate if a tag name is predefined
export const isPredefinedTag = (name: string): boolean => {
  return PREDEFINED_ASSET_TAGS.some(tag => tag.name.toLowerCase() === name.toLowerCase());
};

// Get tags with their colors for display
export const getTagsWithColors = (tagNames: string[]): Array<{ name: string; color: string }> => {
  return tagNames.map(name => ({
    name,
    color: getTagColor(name)
  }));
};

// Sort tags alphabetically
export const sortTags = (tags: string[]): string[] => {
  return [...tags].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
};

// Filter tags by search term
export const filterTags = (searchTerm: string): AssetTag[] => {
  if (!searchTerm.trim()) return PREDEFINED_ASSET_TAGS;
  
  const term = searchTerm.toLowerCase();
  return PREDEFINED_ASSET_TAGS.filter(tag => 
    tag.name.toLowerCase().includes(term) || 
    tag.description.toLowerCase().includes(term)
  );
};
