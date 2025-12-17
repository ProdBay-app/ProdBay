/**
 * File validation utilities for quote request attachments
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Blocked file extensions that trigger email security filters
 * These file types are commonly rejected by Gmail and other providers
 * due to security concerns (executables, archives, scripts)
 */
export const BLOCKED_EXTENSIONS = [
  // Executables
  '.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm',
  // Scripts
  '.bat', '.cmd', '.sh', '.bash', '.ps1', '.vbs', '.js',
  // Archives (often contain executables)
  '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2',
  // Other risky types
  '.bin', '.jar', '.app', '.scr', '.com'
] as const;

/**
 * Extract file extension from filename (case-insensitive)
 * @param filename - File name (e.g., "document.pdf", "FILE.ZIP")
 * @returns Lowercase extension with leading dot (e.g., ".pdf", ".zip") or empty string
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) {
    return ''; // No extension or trailing dot
  }
  return filename.substring(lastDot).toLowerCase();
}

/**
 * Validate file type and size
 * Checks file extension against blocklist first, then validates size
 * @param file - File object to validate
 * @param maxSizeMB - Maximum file size in megabytes (default: 5MB)
 * @returns Validation result with error message if invalid
 */
export function validateFile(file: File, maxSizeMB: number = 5): FileValidationResult {
  // Step 1: Check file extension (fail fast for security)
  const extension = getFileExtension(file.name);
  
  if (extension && BLOCKED_EXTENSIONS.includes(extension as typeof BLOCKED_EXTENSIONS[number])) {
    return {
      valid: false,
      error: `Security Restriction: File type ${extension} is not allowed. Please use a different file format (e.g., PDF, images, or documents).`
    };
  }
  
  // Step 2: Check file size (only if extension is allowed)
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
 * @deprecated Use validateFile() instead. This function only checks size.
 * validateFile() checks both file type and size.
 */
export function validateFileSize(file: File, maxSizeMB: number = 5): FileValidationResult {
  return validateFile(file, maxSizeMB);
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

