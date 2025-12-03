/**
 * Text formatting utilities for consistent data presentation
 */

/**
 * Common acronyms that should be preserved in uppercase format
 * Used by toTitleCase to intelligently format text while preserving acronyms
 */
const COMMON_ACRONYMS = new Set([
  'LED',
  'AV',
  'PA',
  'RF',
  'DMX',
  'WiFi',
  'USB',
  'HDMI',
  'PDF',
  'URL',
  'API',
  'IP',
  'DNS'
]);

/**
 * Converts a string to Title Case, preserving common acronyms
 * 
 * Rules:
 * - Capitalizes first letter of each word
 * - Preserves common acronyms (LED, AV, PA, RF, DMX, WiFi, etc.)
 * - Handles hyphenated words (e.g., "Audio-Visual" → "Audio-Visual")
 * - Trims whitespace and normalizes multiple spaces
 * 
 * Examples:
 * - "led screen" → "LED Screen"
 * - "audio visual system" → "Audio Visual System"
 * - "pa system" → "PA System"
 * - "main stage setup" → "Main Stage Setup"
 * - "LED SCREEN" → "LED Screen"
 * - "wi-fi equipment" → "Wi-Fi Equipment"
 * 
 * @param str - The string to convert to Title Case
 * @returns The formatted string in Title Case
 */
export const toTitleCase = (str: string): string => {
  if (!str || !str.trim()) return str;
  
  // Normalize whitespace: trim and replace multiple spaces with single space
  const normalized = str.trim().replace(/\s+/g, ' ');
  
  // Split into words, preserving spaces and hyphens as separators
  return normalized
    .split(/(\s+|-)/) // Split on spaces or hyphens, keeping separators
    .map(word => {
      // Keep separators (spaces, hyphens) as-is
      if (/^\s+$/.test(word) || word === '-') {
        return word;
      }
      
      // Check if word matches a known acronym (case-insensitive)
      const upperWord = word.toUpperCase();
      if (COMMON_ACRONYMS.has(upperWord)) {
        return upperWord; // Return uppercase acronym
      }
      
      // Default: capitalize first letter, lowercase rest
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
};

