/**
 * File validation utilities for quote request attachments
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate file size against maximum allowed size
 * @param file - File object to validate
 * @param maxSizeMB - Maximum file size in megabytes (default: 5MB)
 * @returns Validation result with error message if invalid
 */
export function validateFileSize(file: File, maxSizeMB: number = 5): FileValidationResult {
  const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds the maximum size of ${maxSizeMB}MB. Please choose a smaller file.`
    };
  }
  
  return { valid: true };
}

/**
 * Format file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.4 MB", "512 KB", "1.2 GB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  // For bytes, show whole number
  if (i === 0) {
    return `${bytes} ${sizes[i]}`;
  }
  
  // For KB, show 1 decimal place
  if (i === 1) {
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }
  
  // For MB and above, show 2 decimal places
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

