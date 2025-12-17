# PR: Block High-Risk File Types to Prevent Email Bounces

## Title
`fix(validation): block high-risk file types (exe, zip, etc) to prevent email bounces`

## Why

**Problem:**
- Users can currently upload any file type, including executables and archives
- Gmail and other email providers reject emails with certain file types (e.g., `.zip` containing installers)
- Error: `552-5.7.0` security error from Gmail when sending `OperaSetup.zip`
- Current validation only checks file **size** (5MB limit), not file **type**
- This causes email delivery failures and poor user experience

**Business Impact:**
- Quote request emails bounce, preventing suppliers from receiving requests
- Users are unaware of the issue until after submission
- No proactive prevention of problematic file types
- Potential security risk from executable files

**Root Cause:**
- `validateFileSize()` function in `src/utils/fileValidation.ts` only validates file size
- No file extension or MIME type validation
- Email providers (especially Gmail) have strict security policies against:
  - Executable files (`.exe`, `.msi`, `.bat`, `.cmd`, `.sh`, `.bin`, `.jar`)
  - Script files (`.js`, `.vbs`)
  - Archive files (`.zip`, `.rar`, `.7z`) - especially when containing executables

**Solution:**
- Implement file extension blocklist validation
- Check file type **before** size validation (fail fast)
- Provide clear error messages explaining why the file type is blocked
- Block high-risk extensions that trigger email security filters

## The Plan

### 1. Update File Validation Utility
**File:** `src/utils/fileValidation.ts`

#### 1.1 Define Blocked Extensions Constant
- **Location:** Top of file, after imports
- **Implementation:**
  ```typescript
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
  ```

#### 1.2 Create Helper Function to Extract File Extension
- **Location:** After `BLOCKED_EXTENSIONS` constant
- **Implementation:**
  ```typescript
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
  ```

#### 1.3 Update Validation Function
- **Location:** Replace `validateFileSize` function
- **Rename:** `validateFileSize` → `validateFile` (now validates both type and size)
- **Implementation:**
  ```typescript
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
  ```

#### 1.4 Maintain Backward Compatibility (Optional)
- **Location:** After `validateFile` function
- **Implementation:** Keep `validateFileSize` as an alias for backward compatibility
  ```typescript
  /**
   * @deprecated Use validateFile() instead. This function only checks size.
   * validateFile() checks both file type and size.
   */
  export function validateFileSize(file: File, maxSizeMB: number = 5): FileValidationResult {
    return validateFile(file, maxSizeMB);
  }
  ```

### 2. Update Frontend Component
**File:** `src/components/producer/EnhancedRequestQuoteFlow.tsx`

#### 2.1 Update Import Statement
- **Location:** Line 7 (imports section)
- **Change:**
  ```typescript
  // Before:
  import { validateFileSize, formatFileSize } from '@/utils/fileValidation';
  
  // After:
  import { validateFile, formatFileSize } from '@/utils/fileValidation';
  ```

#### 2.2 Update Function Calls
- **Location 1:** Line 339 (`handleFileSelect` function)
  ```typescript
  // Before:
  const validation = validateFileSize(file, 5);
  
  // After:
  const validation = validateFile(file, 5);
  ```

- **Location 2:** Line 428 (`handleSendAllRequests` function - safety check)
  ```typescript
  // Before:
  const invalidFiles = allAttachments.filter(file => !validateFileSize(file, 5).valid);
  
  // After:
  const invalidFiles = allAttachments.filter(file => !validateFile(file, 5).valid);
  ```

### 3. Error Message Enhancement
- **Current:** Generic size error
- **New:** Specific error for blocked file types
- **Example:** "Security Restriction: File type .zip is not allowed. Please use a different file format (e.g., PDF, images, or documents)."
- **User Experience:** Clear explanation of why the file is rejected and what alternatives are available

## Impact Analysis

### User Experience
- **Before:** Users can upload `.zip` files, emails bounce silently, no feedback
- **After:** Users get immediate error when selecting blocked file types
- **Benefit:** Proactive prevention, clear error messages, better UX

### File Type Restrictions
- **Blocked Types:**
  - Executables: `.exe`, `.msi`, `.dmg`, `.pkg`, `.deb`, `.rpm`
  - Scripts: `.bat`, `.cmd`, `.sh`, `.bash`, `.ps1`, `.vbs`, `.js`
  - Archives: `.zip`, `.rar`, `.7z`, `.tar`, `.gz`, `.bz2`
  - Other: `.bin`, `.jar`, `.app`, `.scr`, `.com`

- **Allowed Types (examples):**
  - Documents: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`, `.txt`, `.csv`
  - Images: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.svg`
  - Other: Any file type not in the blocklist

### Workflow Changes
- **Before:** Users can attach `.zip` files containing installers
- **After:** Users must:
  1. Extract `.zip` files
  2. Send individual files (PDFs, images, documents)
  3. This is actually **better** for the "Portal Display" feature (individual files are easier to display and download)

### Email Delivery
- **Before:** Emails with `.zip`/`.exe` bounce with `552-5.7.0` error
- **After:** Only safe file types are sent, reducing bounce rate
- **Benefit:** Improved email deliverability, better supplier experience

### Backward Compatibility
- **Option A:** Keep `validateFileSize` as deprecated alias (recommended)
  - Existing code continues to work
  - Gradual migration path
  - No breaking changes

- **Option B:** Remove `validateFileSize` entirely
  - Requires updating all call sites immediately
  - Breaking change
  - Not recommended

### Testing Considerations
- Test with blocked extensions (`.exe`, `.zip`, `.msi`, etc.)
- Test with allowed extensions (`.pdf`, `.jpg`, `.docx`, etc.)
- Test with files that have no extension
- Test with files that have multiple dots (e.g., `file.backup.zip`)
- Test case-insensitive matching (`.ZIP`, `.ExE`, etc.)
- Test error messages are clear and actionable

## Files to Modify

1. `src/utils/fileValidation.ts`
   - Add `BLOCKED_EXTENSIONS` constant
   - Add `getFileExtension()` helper function
   - Rename `validateFileSize` → `validateFile`
   - Add file extension validation logic
   - Keep `validateFileSize` as deprecated alias (optional)

2. `src/components/producer/EnhancedRequestQuoteFlow.tsx`
   - Update import: `validateFileSize` → `validateFile`
   - Update function call: `validateFileSize(file, 5)` → `validateFile(file, 5)`
   - Check for any other usages of `validateFileSize`

## Risk Assessment

**Risk Level:** 🟢 **Low**
- Simple addition of file extension check
- No database changes
- No API contract changes
- Backward compatible (if alias is maintained)
- Clear error messages guide users to alternatives
- Prevents email bounces proactively

**Potential Issues:**
- Users may need to extract `.zip` files before sending (but this is actually better for portal display)
- Some legitimate use cases might be blocked (e.g., `.zip` of PDFs), but security takes priority
- Case sensitivity: Handled by converting to lowercase

**Mitigation:**
- Clear error messages explain why files are blocked
- Suggest alternatives (PDF, images, documents)
- Users can extract archives and send individual files

## Security Notes

- **Email Security:** Prevents sending files that trigger spam/virus filters
- **User Protection:** Blocks executable files that could be malicious
- **Compliance:** Aligns with email provider security policies (Gmail, Outlook, etc.)
- **Best Practice:** Defense in depth - validate on frontend before sending

## Future Enhancements (Out of Scope)

- **Allowlist Strategy:** Consider switching to allowlist (only allow specific safe types) for stricter security
- **MIME Type Validation:** Cross-validate file extension with MIME type to prevent spoofing
- **File Content Scanning:** Scan file contents (not just extension) for actual file type
- **User Feedback:** Show list of allowed file types in UI as guidance

