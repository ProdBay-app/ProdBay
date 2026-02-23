/**
 * Asset Tag Management System
 * Provides predefined tags with unique colors for asset categorization
 * Tag names: single source of truth in config/assetTagNames.json (shared with backend)
 * Colors/descriptions: UI-only metadata in this file
 */

import assetTagNames from '../../config/assetTagNames.json';

export interface AssetTag {
  name: string;
  color: string;
  description: string;
}

/** Tag names from config/assetTagNames.json (single source of truth, shared with backend) */
export const ASSET_TAG_NAMES: string[] = assetTagNames as string[];

// UI-only metadata: color and description per tag name
const TAG_METADATA: Record<string, { color: string; description: string }> = {
  'Audio': { color: '#8B5CF6', description: 'Speakers, microphones, sound systems, wireless, recording' },
  'Branding & Marketing': { color: '#EC4899', description: 'Print, promotional items, social media, brand identity' },
  'Catering': { color: '#EF4444', description: 'Food service, beverages, tableware, bar service' },
  'Floral & Decor': { color: '#F472B6', description: 'Floral arrangements, decorations, linens, draping' },
  'Furniture': { color: '#8B5A2B', description: 'Rental furniture, tables, chairs, lounge seating' },
  'Graphics & Signage': { color: '#059669', description: 'Banners, signage, wayfinding, exhibition displays, print materials' },
  'Lighting': { color: '#F59E0B', description: 'Stage lighting, atmospheric, LED, special effects, power' },
  'Logistics': { color: '#0891B2', description: 'Transport, loading, storage, delivery, waste management' },
  'Medical': { color: '#DC2626', description: 'First aid, medical personnel' },
  'Photography': { color: '#10B981', description: 'Event photography, photo booths, cameras' },
  'Scenic & Props': { color: '#16A34A', description: 'Set construction, backdrops, scenic elements, props' },
  'Staffing': { color: '#F97316', description: 'Event staff, security, hospitality, technical crew' },
  'Staging': { color: '#84CC16', description: 'Stages, rigging, platforms, risers, tents, structures' },
  'Technology': { color: '#60A5FA', description: 'WiFi, digital assets, registration systems, IT support' },
  'Video & Display': { color: '#3B82F6', description: 'LED screens, projection, video production, digital displays' }
};

// Derive full tag list from config + metadata
export const PREDEFINED_ASSET_TAGS: AssetTag[] = ASSET_TAG_NAMES.map(name => ({
  name,
  color: TAG_METADATA[name]?.color ?? '#6B7280',
  description: TAG_METADATA[name]?.description ?? ''
}));

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
