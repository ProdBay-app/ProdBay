# Asset Extraction Standardization Analysis

## 1. Justification & Analysis

### Current Extraction Logic Examination

#### System Prompts

**`/api/process-brief` endpoint** (`railway-backend/services/aiAllocationService.js`):
- **System Prompt (Line 476)**: Focuses on JSON formatting requirements, escape sequences, and preventing merged objects
- **Main Prompt (Lines 712-836)**: Provides event production context, tag lists, and examples
- **Critical Gap**: No explicit "Strict Asset Definition" that defines what constitutes a single asset vs. multiple assets

**`/api/ai/extract-highlights` endpoint** (`railway-backend/services/briefHighlightService.js`):
- **System Prompt (Lines 166-192)**: Focuses on extracting project metadata (name, client, budget, deadline, physical parameters)
- **Not relevant** to asset extraction granularity issue

### Comparison: How AI Handled HV1, HV2, and HV3

#### HV1_Adidas_LE.pdf Processing
- **Extracted Asset**: `"Industrial workbenches, stools, and racks"` (ONE asset)
- **Source Text**: `"Industrial workbenches, stools, and racks"`
- **Tags**: `["Furniture", "Decor"]`
- **Analysis**: AI treated the comma-separated list as a single functional unit

#### HV2_Adidas_LE.pdf Processing  
- **Extracted Asset**: `"Industrial Workbenches & Stools"` (ONE asset, **racks missing**)
- **Source Text**: `"Retail/Lounge: Pop-up store fixtures , industrial workbenches/stools , café lounge furniture."`
- **Tags**: `["Furniture", "Exhibition Displays"]`
- **Analysis**: AI grouped workbenches and stools but **omitted racks** entirely (not present in source text)

#### HV3_Adidas_LE.pdf Processing
- **Extracted Asset**: `"Industrial Workbenches and Stools"` (ONE asset, **racks missing**)
- **Source Text**: `"Asset: Furniture. ○ Detail: Industrial workbenches and stools."`
- **Tags**: `["Furniture"]`
- **Analysis**: AI followed the source text exactly, which didn't mention racks

### Root Cause Analysis

**The Problem: "Atomization vs. Clustering"**

The AI is inconsistently grouping/splitting assets based on:

1. **Source Document Formatting**:
   - Comma-separated lists → Treated as single asset (HV1)
   - Slash-separated items (`workbenches/stools`) → Treated as single asset (HV2)
   - Narrative descriptions → Followed verbatim (HV3)

2. **Missing Asset Definition**:
   - No explicit rule: "A physical item or crew role required for production"
   - No guidance on when to group vs. split
   - No master reference list of "core assets" to match against

3. **Context-Dependent Interpretation**:
   - AI infers grouping from document structure rather than functional purpose
   - Different brief formats (list vs. narrative vs. table) produce different results

### Can This Be Fixed Via Prompt Engineering Alone?

**YES, with high confidence.** The issue is fundamentally a **prompt clarity problem**, not a code logic problem. The current prompts:
- ✅ Already enforce JSON structure
- ✅ Already prevent merged objects
- ❌ **Missing**: Strict asset definition
- ❌ **Missing**: Grouping/splitting rules
- ❌ **Missing**: Reference to a canonical asset list

**Solution Approach**: Add explicit rules to the system prompt and main prompt that:
1. Define what constitutes a "single asset"
2. Provide grouping/splitting guidelines
3. Reference a master list of expected assets (if available)

---

## 2. The PR Description (The Plan)

### Title
`feat: standardize asset extraction logic and entity grouping`

### Why
To eliminate variability in asset counts caused by different document formatting. We require consistent output of core assets regardless of whether the input is a list, a table, or a narrative description.

### The Plan

#### A. Update System Prompt (`aiAllocationService.js` Line 476)

**Add "Strict Asset Definition" Section:**

```javascript
// Add to system prompt:
"STRICT ASSET DEFINITION:
- An asset is a SINGLE physical item, piece of equipment, service, or crew role required for production
- Each asset must be functionally distinct and independently procurable
- Grouping Rule: Items listed together (e.g., 'workbenches, stools, and racks') should be split into separate assets UNLESS they are:
  a) Part of a pre-assembled kit/set (e.g., 'DJ booth package')
  b) Functionally inseparable (e.g., 'LED wall with mounting hardware')
  c) Explicitly described as a single unit in the brief
- Splitting Rule: When you see comma-separated or slash-separated lists, create separate assets for each item
- Example: 'Industrial workbenches, stools, and racks' → THREE assets:
  * 'Industrial Workbenches'
  * 'Stools'  
  * 'Storage Racks'
- Exception: If the brief explicitly states 'workbench set' or 'furniture package', treat as one asset"
```

#### B. Update Main Prompt (`buildAssetAnalysisPrompt` Lines 782-814)

**Enhance "CRITICAL ATOMICITY REQUIREMENTS" Section:**

```javascript
// Replace existing section with:
"CRITICAL ATOMICITY REQUIREMENTS:

1. ASSET GRANULARITY RULES:
   - Each asset MUST represent a single, independently procurable item
   - When source text lists multiple items (comma, slash, or 'and' separated), split into separate assets
   - Example: 'workbenches, stools, and racks' → Create 3 separate assets
   - Example: 'workbenches/stools' → Create 2 separate assets
   - Exception: Only group if brief explicitly describes as a 'set', 'package', or 'kit'

2. JSON STRUCTURE REQUIREMENTS:
   - Each asset MUST be its own closed JSON object within the array
   - Every asset object MUST end with a closing brace } before the next asset begins
   - NEVER list two or more 'asset_name' fields within a single object
   - Each object must be completely self-contained with all its properties before closing with }

3. CONSISTENCY REQUIREMENTS:
   - Use consistent naming conventions (e.g., 'Industrial Workbenches' not 'workbenches' in one place and 'Workbenches' in another)
   - If an asset appears in multiple briefs, use the same name and structure
   - Reference the same functional purpose across all extractions"
```

#### C. Add Deduplication Guidance

**Add to main prompt after tag selection rules:**

```javascript
"DEDUPLICATION LOGIC:
- If multiple items serve the same functional purpose in the same zone, they should be grouped ONLY if:
  a) They are explicitly described as a set/package
  b) They are functionally inseparable (e.g., 'stage with built-in lighting')
- Otherwise, create separate assets for each distinct item
- Use consistent asset names across all briefs for the same item type"
```

#### D. Refine JSON Schema (No Schema Changes Required)

**Current schema is adequate:**
```json
{
  "asset_name": "string",
  "specifications": "string", 
  "source_text": "string",
  "tags": ["string"]
}
```

**No changes needed** - the schema supports both grouped and split assets. The fix is purely in prompt guidance.

### Impact Analysis

#### Supabase (`assets` table)
- **Impact**: ✅ **NO SCHEMA CHANGES REQUIRED**
- **Reasoning**: The existing schema already supports variable asset names. Standardization happens at extraction time, not storage time.
- **Migration**: None needed

#### Vercel/Frontend
- **Impact**: ✅ **NO UI CHANGES REQUIRED**
- **Reasoning**: The UI already handles variable asset counts. Standardization will improve consistency but doesn't require UI modifications.
- **Testing**: Should verify that asset lists display correctly with the new standardized extraction

#### Railway (Processing)
- **Impact**: ⚠️ **MINOR - POTENTIAL TOKEN USAGE INCREASE**
- **Reasoning**: Splitting grouped items into separate assets will increase the number of assets extracted, potentially increasing:
  - Completion tokens (more assets = longer JSON response)
  - Processing time (slightly longer JSON parsing)
- **Mitigation**: 
  - Current `max_completion_tokens: 24000` provides ample headroom
  - Expected increase: ~10-20% more tokens for briefs with many grouped items
  - Monitor token usage after deployment

#### Backward Compatibility
- **Impact**: ✅ **FULLY BACKWARD COMPATIBLE**
- **Reasoning**: 
  - Existing assets in database remain unchanged
  - New extractions will be more consistent
  - No breaking changes to API contracts

---

## 3. Testing Strategy

### Test Cases

1. **HV1_Adidas_LE.pdf** (Re-extract)
   - **Expected**: `"Industrial workbenches, stools, and racks"` → Split into 3 assets:
     - "Industrial Workbenches"
     - "Stools"
     - "Storage Racks"

2. **HV2_Adidas_LE.pdf** (Re-extract)
   - **Expected**: `"industrial workbenches/stools"` → Split into 2 assets:
     - "Industrial Workbenches"
     - "Stools"
   - **Note**: Racks not in source, so won't appear (correct behavior)

3. **HV3_Adidas_LE.pdf** (Re-extract)
   - **Expected**: `"Industrial workbenches and stools"` → Split into 2 assets:
     - "Industrial Workbenches"
     - "Stools"

4. **Edge Cases**:
   - "DJ booth package" → Should remain as ONE asset (explicit package)
   - "LED wall with mounting hardware" → Should remain as ONE asset (functionally inseparable)
   - "Tables, chairs, linens" → Should split into THREE assets

---

## 4. Implementation Checklist

Once approved, implement in this order:

1. ✅ Update system prompt in `aiAllocationService.js` (Line 476)
2. ✅ Update main prompt in `buildAssetAnalysisPrompt()` (Lines 782-814)
3. ✅ Add deduplication guidance section
4. ✅ Test against HV1, HV2, HV3 PDFs
5. ✅ Verify token usage remains within limits
6. ✅ Document changes in code comments

---

## 5. Success Criteria

- [ ] HV1, HV2, HV3 produce consistent asset counts for similar items
- [ ] "Industrial workbenches, stools, and racks" consistently splits into 3 assets
- [ ] Explicit packages/sets remain grouped as single assets
- [ ] Token usage increase stays under 20%
- [ ] No regression in existing asset extraction quality

---

**Status**: ⏸️ **AWAITING APPROVAL**

**Next Steps**: Wait for "LGTM" or "Approved" before implementing changes.

