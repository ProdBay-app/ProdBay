/**
 * Service Tag Management System
 * Provides predefined tags with unique colors for wedding service categorization
 * Comprehensive taxonomy for Wedding Planning industry
 */

export interface AssetTag {
  name: string;
  color: string;
  description: string;
}

// Predefined service tags with unique colors
// Organized by category for Wedding Planning: Venue, Catering, Photo/Video, Music, Florals, Attire, Beauty, Stationery, Transport, Cake, Ceremony, Reception, Lighting, Planning, Rentals
export const PREDEFINED_ASSET_TAGS: AssetTag[] = [
  // VENUE & SPACES (6 tags)
  {
    name: 'Venue',
    color: '#8B5CF6', // Purple-500
    description: 'Ceremony and reception venues, indoor and outdoor spaces'
  },
  {
    name: 'Ceremony Site',
    color: '#A855F7', // Purple-600
    description: 'Church, garden, beach, or other ceremony locations'
  },
  {
    name: 'Reception Venue',
    color: '#9333EA', // Purple-700
    description: 'Ballrooms, banquet halls, estates, restaurants'
  },
  {
    name: 'Outdoor Spaces',
    color: '#7C3AED', // Purple-800
    description: 'Gardens, terraces, courtyards, marquees'
  },
  {
    name: 'Getting Ready Suite',
    color: '#6366F1', // Indigo-500
    description: 'Bridal suite, groom\'s room, preparation areas'
  },
  {
    name: 'Cocktail Area',
    color: '#4F46E5', // Indigo-600
    description: 'Pre-reception drinks area, lounge spaces'
  },

  // CATERING & DINING (6 tags)
  {
    name: 'Catering',
    color: '#EF4444', // Red-500
    description: 'Full-service catering, meal planning, chef services'
  },
  {
    name: 'Beverages & Bar',
    color: '#EC4899', // Pink-500
    description: 'Bar service, cocktails, wine, champagne toast'
  },
  {
    name: 'Wedding Cake',
    color: '#DB2777', // Pink-600
    description: 'Wedding cake design, tasting, delivery, and setup'
  },
  {
    name: 'Dessert Table',
    color: '#BE185D', // Pink-700
    description: 'Dessert bars, sweet stations, pastries, candy buffet'
  },
  {
    name: 'Tableware & Linens',
    color: '#F43F5E', // Rose-500
    description: 'China, glassware, flatware, table linens, napkins'
  },
  {
    name: 'Food Stations',
    color: '#E11D48', // Rose-600
    description: 'Buffet stations, carving stations, food trucks'
  },

  // PHOTOGRAPHY & VIDEOGRAPHY (5 tags)
  {
    name: 'Photography',
    color: '#3B82F6', // Blue-500
    description: 'Wedding photographer, engagement shoots, portraits'
  },
  {
    name: 'Videography',
    color: '#2563EB', // Blue-600
    description: 'Wedding videographer, highlight reels, cinematic films'
  },
  {
    name: 'Photo Booth',
    color: '#1D4ED8', // Blue-700
    description: 'Photo booth rental, props, instant prints'
  },
  {
    name: 'Drone Coverage',
    color: '#10B981', // Emerald-500
    description: 'Aerial photography and videography'
  },
  {
    name: 'Live Streaming',
    color: '#059669', // Emerald-600
    description: 'Virtual ceremony streaming for remote guests'
  },

  // MUSIC & ENTERTAINMENT (5 tags)
  {
    name: 'DJ Services',
    color: '#F59E0B', // Amber-500
    description: 'Wedding DJ, MC services, sound system'
  },
  {
    name: 'Live Band',
    color: '#D97706', // Amber-600
    description: 'Live band, musicians, string quartet, jazz ensemble'
  },
  {
    name: 'Ceremony Music',
    color: '#F97316', // Orange-500
    description: 'Processional, recessional, ceremony musicians'
  },
  {
    name: 'Entertainment',
    color: '#EA580C', // Orange-600
    description: 'Dancers, performers, fireworks, sparkler exits'
  },
  {
    name: 'Sound System',
    color: '#C2410C', // Orange-700
    description: 'PA system, microphones, speakers for ceremony and reception'
  },

  // FLORALS & DECOR (6 tags)
  {
    name: 'Bridal Bouquet',
    color: '#F472B6', // Pink-400
    description: 'Bridal bouquet, bridesmaids bouquets, boutonnieres'
  },
  {
    name: 'Ceremony Florals',
    color: '#FB7185', // Rose-400
    description: 'Altar arrangements, aisle flowers, petal scatter'
  },
  {
    name: 'Reception Florals',
    color: '#A78BFA', // Violet-400
    description: 'Centerpieces, table garlands, hanging installations'
  },
  {
    name: 'Decor & Styling',
    color: '#8B5A2B', // Brown
    description: 'Table settings, place cards, candles, decorative elements'
  },
  {
    name: 'Linens & Draping',
    color: '#84CC16', // Lime-500
    description: 'Ceiling drapes, fabric treatments, chair covers'
  },
  {
    name: 'Furniture Rentals',
    color: '#65A30D', // Lime-600
    description: 'Tables, chairs, lounge furniture, arches, arbors'
  },

  // LIGHTING & AMBIANCE (4 tags)
  {
    name: 'Lighting Design',
    color: '#DC2626', // Red-600
    description: 'Uplighting, string lights, chandeliers, spotlights'
  },
  {
    name: 'Candles & Lanterns',
    color: '#B91C1C', // Red-700
    description: 'Candle arrangements, lanterns, luminaries'
  },
  {
    name: 'Special Effects',
    color: '#991B1B', // Red-800
    description: 'Fog machines, sparklers, confetti, fireworks'
  },
  {
    name: 'Signage',
    color: '#047857', // Emerald-700
    description: 'Welcome signs, seating charts, directional signs'
  },

  // WEDDING ATTIRE & BEAUTY (5 tags)
  {
    name: 'Bridal Attire',
    color: '#06B6D4', // Cyan-500
    description: 'Wedding dress, veil, accessories, alterations'
  },
  {
    name: 'Groom Attire',
    color: '#0891B2', // Cyan-600
    description: 'Suit or tuxedo, accessories, groomsmen attire'
  },
  {
    name: 'Hair & Makeup',
    color: '#0E7490', // Cyan-700
    description: 'Bridal hair, makeup artist, bridal party styling'
  },
  {
    name: 'Accessories',
    color: '#155E75', // Cyan-800
    description: 'Jewelry, shoes, ties, cufflinks, veils, headpieces'
  },
  {
    name: 'Wedding Rings',
    color: '#164E63', // Cyan-900
    description: 'Wedding bands, ring engraving, ring bearer accessories'
  },

  // STATIONERY & PRINT (4 tags)
  {
    name: 'Invitations',
    color: '#16A34A', // Green-600
    description: 'Wedding invitations, save-the-dates, RSVP cards'
  },
  {
    name: 'Day-of Stationery',
    color: '#15803D', // Green-700
    description: 'Programs, menus, place cards, table numbers'
  },
  {
    name: 'Thank You Cards',
    color: '#166534', // Green-800
    description: 'Post-wedding thank you notes and correspondence'
  },
  {
    name: 'Guest Book',
    color: '#0F766E', // Teal-700
    description: 'Guest book, alternative guest book ideas'
  },

  // TRANSPORTATION & LOGISTICS (4 tags)
  {
    name: 'Transportation',
    color: '#0891B2', // Cyan-600
    description: 'Limousines, vintage cars, shuttle buses, valet'
  },
  {
    name: 'Accommodation',
    color: '#7F1D1D', // Red-900
    description: 'Hotel room blocks, guest accommodations'
  },
  {
    name: 'Permits & Licenses',
    color: '#60A5FA', // Blue-400
    description: 'Marriage license, venue permits, insurance'
  },
  {
    name: 'Welcome Bags',
    color: '#3B82F6', // Blue-500
    description: 'Guest welcome bags, out-of-town guest gifts'
  },

  // PLANNING & COORDINATION (4 tags)
  {
    name: 'Day-of Coordination',
    color: '#F97316', // Orange-500
    description: 'Day-of wedding coordinator, timeline management'
  },
  {
    name: 'Rehearsal Dinner',
    color: '#7F1D1D', // Red-900
    description: 'Rehearsal dinner venue, catering, coordination'
  },
  {
    name: 'Officiant',
    color: '#DC2626', // Red-600
    description: 'Wedding officiant, ceremony planning, vows'
  },
  {
    name: 'Wedding Favors',
    color: '#BE185D', // Pink-700
    description: 'Guest favors, personalized gifts, charitable donations'
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
