# PR Plan: Enforce Title Case Persistence for Asset Names

## PR Title
**`refactor(logic): enforce Title Case persistence for asset names`**

---

## Phase 1: Justification & Analysis

### Component Locations

✅ **Display Components:**
- `src/components/producer/AssetDetailModal.tsx` - Line 127 (header), Line 179 (overview)

✅ **Save Logic Components:**
- `src/components/producer/AssetFormModal.tsx` - Line 118 (`onSubmit(formData)`)
- `src/components/producer/AssetDetailModal.tsx` - Line 66 (`handleFieldEdit` - update handler)
- `src/components/producer/AssetList.tsx` - Line 103 (create), Line 148 (update)
- `src/components/producer/AssetSubdivisionModal.tsx` - Line 110 (subdivision create)

### Current Behavior

**Display:**
- Asset names are displayed exactly as stored in the database
- No transformation applied

**Save Logic:**
- Asset names are saved exactly as entered by the user
- No normalization or formatting applied
- User can enter: "led screen", "LED Screen", "Led Screen", etc.

### Problem Identified

**Issue:** Asset names are stored inconsistently in the database:
- Some may be lowercase: "led screen"
- Some may be uppercase: "LED SCREEN"
- Some may be mixed case: "Led Screen"
- Some may be properly formatted: "LED Screen"

**User Requirement:** 
- Asset names should be persisted in Title Case format
- **"It shouldn't just be visual"** - CSS `capitalize` is not sufficient
- Need to transform the actual string data before saving

---

## Phase 2: The PR Description (The Plan)

### Why
Asset names should be consistently stored in Title Case format to ensure data quality, improve searchability, and provide a professional appearance. Since this is data-level transformation (not just visual), we need to apply it during save operations.

### The Plan

#### 1. Create Text Formatting Utility

**New File:** `src/utils/textFormatters.ts`

**Function:** `toTitleCase(str: string): string`

**Logic:**

```typescript
/**
 * Converts a string to Title Case, preserving common acronyms
 * 
 * Rules:
 * - Capitalizes first letter of each word
 * - Preserves common acronyms (LED, AV, PA, RF, DMX, WiFi, etc.)
 * - Handles hyphenated words (e.g., "Audio-Visual" → "Audio-Visual")
 * - Handles apostrophes (e.g., "O'Brien" → "O'Brien")
 * - Trims whitespace and normalizes multiple spaces
 * 
 * Examples:
 * - "led screen" → "LED Screen"
 * - "audio visual system" → "Audio Visual System"
 * - "pa system" → "PA System"
 * - "wi-fi equipment" → "Wi-Fi Equipment"
 * - "main stage setup" → "Main Stage Setup"
 */
```

**Acronym Handling:**
- Maintain a list of common event production acronyms
- Check if a word matches an acronym (case-insensitive)
- If match found, convert to uppercase version
- If no match, capitalize first letter, lowercase rest

**Proposed Acronym List:**
- `LED` - Light Emitting Diode
- `AV` - Audio Visual
- `PA` - Public Address
- `RF` - Radio Frequency
- `DMX` - Digital Multiplex
- `WiFi` / `Wi-Fi` - Wireless Fidelity
- `USB` - Universal Serial Bus
- `HDMI` - High-Definition Multimedia Interface
- `PDF` - Portable Document Format
- `URL` - Uniform Resource Locator

**Implementation Strategy:**
1. Split string into words (handle spaces, hyphens, apostrophes)
2. For each word:
   - Check if it's a known acronym (case-insensitive)
   - If acronym: use uppercase version
   - If not: capitalize first letter, lowercase rest
3. Handle special cases:
   - Hyphenated words: process each part independently
   - Apostrophes: preserve and capitalize letter after apostrophe
   - Numbers: leave as-is

#### 2. Update Display Components

**File:** `src/components/producer/AssetDetailModal.tsx`

**Changes:**
- Line 127: Apply `toTitleCase()` to header display
- Line 179: Apply `toTitleCase()` to overview display (view mode)

**Note:** These are display-only changes for consistency. The actual transformation happens during save.

#### 3. Update Save Logic

**File:** `src/components/producer/AssetFormModal.tsx`
- Line 118: Apply `toTitleCase()` to `formData.asset_name` before calling `onSubmit()`

**File:** `src/components/producer/AssetDetailModal.tsx`
- Line 66: Apply `toTitleCase()` to `editingData.asset_name` before saving in `handleFieldEdit()`

**File:** `src/components/producer/AssetList.tsx`
- Line 103: Apply `toTitleCase()` to `assetData.asset_name` before creating asset
- Line 148: Apply `toTitleCase()` to `assetData.asset_name` before updating asset

**File:** `src/components/producer/AssetSubdivisionModal.tsx`
- Line 110: Apply `toTitleCase()` to `subAsset.asset_name.trim()` before creating asset

---

## Phase 3: Proposed `toTitleCase` Function Logic

### Function Signature

```typescript
export const toTitleCase = (str: string): string
```

### Acronym List

```typescript
const COMMON_ACRONYMS = [
  'LED', 'AV', 'PA', 'RF', 'DMX', 'WiFi', 'Wi-Fi',
  'USB', 'HDMI', 'PDF', 'URL', 'API', 'IP', 'DNS'
];
```

### Algorithm

```typescript
toTitleCase(input: string): string {
  // 1. Trim and normalize whitespace
  let normalized = str.trim().replace(/\s+/g, ' ');
  
  // 2. Split into words (handle spaces, hyphens)
  const words = normalized.split(/(\s+|[-])/);
  
  // 3. Process each word
  return words.map(word => {
    // Skip separators (spaces, hyphens) - keep as-is
    if (word === ' ' || word === '-') return word;
    
    // Check if word is a known acronym (case-insensitive)
    const acronym = COMMON_ACRONYMS.find(ac => 
      ac.toLowerCase() === word.toLowerCase()
    );
    
    if (acronym) {
      return acronym; // Return uppercase acronym
    }
    
    // Handle apostrophes (e.g., "O'Brien")
    if (word.includes("'")) {
      return word
        .split("'")
        .map((part, index) => 
          index === 0 
            ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        )
        .join("'");
    }
    
    // Default: Capitalize first letter, lowercase rest
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join('');
}
```

### Edge Cases

1. **All Caps:** "LED SCREEN" → "LED Screen"
2. **All Lowercase:** "led screen" → "LED Screen"
3. **Mixed Case:** "Led Screen" → "LED Screen"
4. **Hyphenated:** "audio-visual" → "Audio-Visual"
5. **Apostrophes:** "o'brien system" → "O'Brien System"
6. **Numbers:** "stage 1" → "Stage 1"
7. **Empty/String:** "" → "" (handle gracefully)

### Alternative Simpler Approach

If the above is too complex, a simpler approach:

```typescript
export const toTitleCase = (str: string): string => {
  if (!str || !str.trim()) return str;
  
  // Common acronyms map (case-insensitive lookup)
  const acronyms = new Set([
    'LED', 'AV', 'PA', 'RF', 'DMX', 'WiFi', 'USB', 'HDMI', 'PDF', 'URL'
  ]);
  
  // Split into words (preserve spaces)
  return str
    .trim()
    .split(/(\s+|-)/) // Split on spaces or hyphens, keeping separators
    .map(word => {
      // Keep separators as-is
      if (/^\s+$/.test(word) || word === '-') return word;
      
      // Check if word matches an acronym
      const upperWord = word.toUpperCase();
      if (acronyms.has(upperWord)) {
        return upperWord;
      }
      
      // Default: capitalize first letter, lowercase rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
};
```

---

## Phase 3: Await Approval

**Status:** ⏸️ **AWAITING APPROVAL**

### Proposed `toTitleCase` Function

**File to Create:** `src/utils/textFormatters.ts`

**Function Logic:**

**Option A: Simple Approach (Recommended)**
- Split on spaces and hyphens
- Check each word against acronym list (case-insensitive)
- If acronym: use uppercase version
- If not: capitalize first letter, lowercase rest
- Preserve separators (spaces, hyphens)

**Option B: Advanced Approach**
- Handle apostrophes separately
- More sophisticated word splitting
- Better handling of special characters

**Acronym List (Proposed):**
```typescript
['LED', 'AV', 'PA', 'RF', 'DMX', 'WiFi', 'USB', 'HDMI', 'PDF', 'URL', 'API', 'IP', 'DNS']
```

### Example Transformations

| Input | Output | Explanation |
|-------|--------|-------------|
| `"led screen"` | `"LED Screen"` | LED is acronym, Screen is capitalized |
| `"audio visual system"` | `"Audio Visual System"` | All words capitalized |
| `"pa system"` | `"PA System"` | PA is acronym |
| `"main stage setup"` | `"Main Stage Setup"` | Standard title case |
| `"LED SCREEN"` | `"LED Screen"` | Preserves acronym, normalizes rest |
| `"wi-fi equipment"` | `"Wi-Fi Equipment"` | Hyphen preserved, both parts capitalized |

### Implementation Locations

**Files to Modify:**

1. **Create:** `src/utils/textFormatters.ts` (new utility file)
2. **Update:** `src/components/producer/AssetDetailModal.tsx`
   - Line 127: Header display
   - Line 66: Save handler
3. **Update:** `src/components/producer/AssetFormModal.tsx`
   - Line 118: Submit handler
4. **Update:** `src/components/producer/AssetList.tsx`
   - Line 103: Create handler
   - Line 148: Update handler
5. **Update:** `src/components/producer/AssetSubdivisionModal.tsx`
   - Line 110: Create handler

---

## Phase 4: Impact Analysis

### ✅ Data Consistency
- All new asset names will be stored in Title Case
- Existing asset names will be formatted on next edit
- Search and filtering will work better with consistent casing

### ✅ Professional Appearance
- Uniform display format
- Better user experience
- Industry-standard naming conventions

### ✅ Backward Compatible
- Existing assets continue to work
- Transformation only happens on save/update
- No breaking changes to data structure

### ⚠️ Migration Consideration
- Existing assets won't be automatically converted
- They will be formatted when next edited
- Optional: Could add a migration script to format all existing assets

---

**Status:** ⏸️ **AWAITING APPROVAL**

Please review and confirm:
1. ✅ Approve the simple approach (Option A) for `toTitleCase` function
2. ✅ Approve the proposed acronym list (or suggest additions/removals)
3. ✅ Approve the implementation locations
4. ❌ Prefer the advanced approach (Option B) with apostrophe handling
5. ❌ Need different logic or edge case handling

Once approved, we'll proceed with Phase 4: Incremental Implementation.

