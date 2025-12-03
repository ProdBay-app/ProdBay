/**
 * Asset Tag Management System
 * Provides predefined tags with unique colors for asset categorization
 * Comprehensive 50-tag taxonomy for Event Production industry
 */

export interface AssetTag {
  name: string;
  color: string;
  description: string;
}

// Predefined asset tags with unique colors
// Organized by category: Audio, Visual, Lighting, Staging, Catering, Staffing, Logistics, Branding, Decor, Digital
export const PREDEFINED_ASSET_TAGS: AssetTag[] = [
  // AUDIO & SOUND (7 tags)
  {
    name: 'Audio Equipment',
    color: '#8B5CF6', // Purple-500
    description: 'Speakers, amplifiers, mixers, sound systems'
  },
  {
    name: 'Microphones',
    color: '#A855F7', // Purple-600
    description: 'Wireless, wired, handheld, lapel, podium mics'
  },
  {
    name: 'Sound Reinforcement',
    color: '#9333EA', // Purple-700
    description: 'PA systems, monitors, subwoofers'
  },
  {
    name: 'Audio Recording',
    color: '#7C3AED', // Purple-800
    description: 'Recording equipment, multi-track systems'
  },
  {
    name: 'Wireless Systems',
    color: '#6366F1', // Indigo-500
    description: 'RF transmitters, receivers, intercom systems'
  },
  {
    name: 'Audio Visual',
    color: '#4F46E5', // Indigo-600
    description: 'Integrated AV systems, video walls with sound'
  },
  {
    name: 'Backstage Audio',
    color: '#4338CA', // Indigo-700
    description: 'Monitor mixes, green room audio'
  },

  // VISUAL & DISPLAYS (8 tags)
  {
    name: 'LED Screens',
    color: '#3B82F6', // Blue-500
    description: 'LED walls, video walls, display panels'
  },
  {
    name: 'Projection',
    color: '#2563EB', // Blue-600
    description: 'Projectors, projection mapping, screen rentals'
  },
  {
    name: 'Video Production',
    color: '#1D4ED8', // Blue-700
    description: 'Video cameras, live streaming, broadcast'
  },
  {
    name: 'Photography',
    color: '#10B981', // Emerald-500
    description: 'Event photography, photo booths, cameras'
  },
  {
    name: 'Graphics & Banners',
    color: '#059669', // Emerald-600
    description: 'Custom graphics, banners, backdrops'
  },
  {
    name: 'Signage',
    color: '#047857', // Emerald-700
    description: 'Wayfinding, directional signs, informational displays'
  },
  {
    name: 'Digital Displays',
    color: '#06B6D4', // Cyan-500
    description: 'Touchscreens, interactive displays, kiosks'
  },
  {
    name: 'Exhibition Displays',
    color: '#0891B2', // Cyan-600
    description: 'Trade show booths, modular displays'
  },

  // LIGHTING (6 tags)
  {
    name: 'Stage Lighting',
    color: '#F59E0B', // Amber-500
    description: 'Stage wash, spotlights, moving lights'
  },
  {
    name: 'Atmospheric Lighting',
    color: '#D97706', // Amber-600
    description: 'Uplighting, color washes, ambiance'
  },
  {
    name: 'LED Lighting',
    color: '#F97316', // Orange-500
    description: 'LED strips, panels, color-changing systems'
  },
  {
    name: 'Special Effects',
    color: '#EA580C', // Orange-600
    description: 'Fog machines, lasers, pyrotechnics'
  },
  {
    name: 'Power & Distribution',
    color: '#C2410C', // Orange-700
    description: 'Power distribution, dimmers, control systems'
  },
  {
    name: 'Lighting Design',
    color: '#DC2626', // Red-600
    description: 'Lighting programming, design services'
  },

  // STAGING & STRUCTURES (5 tags)
  {
    name: 'Stages',
    color: '#84CC16', // Lime-500
    description: 'Main stages, platforms, risers, decking'
  },
  {
    name: 'Rigging',
    color: '#65A30D', // Lime-600
    description: 'Rigging points, truss, chain hoists, safety'
  },
  {
    name: 'Scenic Elements',
    color: '#16A34A', // Green-600
    description: 'Set construction, backdrops, props'
  },
  {
    name: 'Platforms & Risers',
    color: '#15803D', // Green-700
    description: 'Stage extensions, speaker platforms'
  },
  {
    name: 'Tents & Structures',
    color: '#166534', // Green-800
    description: 'Temporary structures, tenting, canopies'
  },

  // CATERING & FOOD SERVICE (4 tags)
  {
    name: 'Catering',
    color: '#EF4444', // Red-500
    description: 'Food service, meal planning, kitchen equipment'
  },
  {
    name: 'Beverages',
    color: '#EC4899', // Pink-500
    description: 'Bar service, beverage stations, drink service'
  },
  {
    name: 'Tableware',
    color: '#DB2777', // Pink-600
    description: 'Linens, china, glassware, flatware'
  },
  {
    name: 'Food Stations',
    color: '#BE185D', // Pink-700
    description: 'Buffet stations, carving stations, dessert bars'
  },

  // STAFFING & SERVICES (5 tags)
  {
    name: 'Event Staff',
    color: '#F97316', // Orange-500 (different shade)
    description: 'General event staff, setup crew'
  },
  {
    name: 'Security',
    color: '#7F1D1D', // Red-900
    description: 'Security personnel, crowd management'
  },
  {
    name: 'Hospitality',
    color: '#B91C1C', // Red-700
    description: 'Guest services, concierge, greeters'
  },
  {
    name: 'Technical Staff',
    color: '#991B1B', // Red-800
    description: 'AV technicians, lighting operators'
  },
  {
    name: 'Medical Services',
    color: '#DC2626', // Red-600
    description: 'First aid, medical personnel'
  },

  // LOGISTICS & OPERATIONS (5 tags)
  {
    name: 'Transportation',
    color: '#0891B2', // Cyan-600
    description: 'Vehicle rentals, shuttles, delivery'
  },
  {
    name: 'Loading & Setup',
    color: '#0E7490', // Cyan-700
    description: 'Loading dock, freight, equipment delivery'
  },
  {
    name: 'Storage',
    color: '#155E75', // Cyan-800
    description: 'Warehousing, equipment storage, staging areas'
  },
  {
    name: 'Permits & Licenses',
    color: '#164E63', // Cyan-900
    description: 'Event permits, licenses, approvals'
  },
  {
    name: 'Waste Management',
    color: '#0F766E', // Teal-700
    description: 'Trash removal, recycling, cleanup'
  },

  // BRANDING & MARKETING (4 tags)
  {
    name: 'Branding',
    color: '#EC4899', // Pink-500
    description: 'Logo application, brand identity, color schemes'
  },
  {
    name: 'Print Materials',
    color: '#F43F5E', // Rose-500
    description: 'Brochures, flyers, programs, handouts'
  },
  {
    name: 'Promotional Items',
    color: '#E11D48', // Rose-600
    description: 'Swag, giveaways, branded merchandise'
  },
  {
    name: 'Social Media',
    color: '#BE185D', // Pink-700
    description: 'Content creation, live posting, coverage'
  },

  // DECOR & FLORAL (4 tags)
  {
    name: 'Floral',
    color: '#F472B6', // Pink-400
    description: 'Flower arrangements, centerpieces, installations'
  },
  {
    name: 'Decor',
    color: '#FB7185', // Rose-400
    description: 'Decorative elements, props, themed decorations'
  },
  {
    name: 'Furniture',
    color: '#8B5A2B', // Brown (custom)
    description: 'Rental furniture, tables, chairs, lounge seating'
  },
  {
    name: 'Linens & Draping',
    color: '#A78BFA', // Violet-400
    description: 'Table linens, drapes, fabric treatments'
  },

  // DIGITAL & TECHNOLOGY (2 tags)
  {
    name: 'Digital Assets',
    color: '#3B82F6', // Blue-500
    description: 'Websites, apps, online platforms, registration systems'
  },
  {
    name: 'Technology Infrastructure',
    color: '#60A5FA', // Blue-400
    description: 'WiFi, networking, IT support, charging stations'
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
