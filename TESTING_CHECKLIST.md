# Testing Checklist: Asset Extraction Standardization

## Pre-Testing Setup

- [ ] Deploy updated code to Railway staging environment
- [ ] Verify OpenAI API key is configured
- [ ] Have HV1, HV2, HV3 PDF text extracts ready

## Test Case 1: HV1_Adidas_LE.pdf

### Input
- Brief text from HV1 PDF

### Expected Behavior
- [ ] "Industrial workbenches, stools, and racks" → **3 separate assets**:
  - [ ] Asset 1: "Industrial Workbenches" (or similar)
  - [ ] Asset 2: "Stools" (or similar)
  - [ ] Asset 3: "Storage Racks" (or similar)
- [ ] Crew roles are separated (not grouped as "Crew")
- [ ] Total asset count should be **~26 assets** (may vary slightly based on brief content)

### Verification
```bash
# Extract text from PDF
POST /api/extract-text-from-pdf
# Then process brief
POST /api/process-brief
{
  "projectId": "<test-uuid>",
  "briefDescription": "<hv1-extracted-text>",
  "allocationMethod": "ai"
}
```

### Check Response
- [ ] `assets` array contains separate entries for workbenches, stools, racks
- [ ] No asset named "Industrial workbenches, stools, and racks" (grouped)
- [ ] Asset names are consistent and properly capitalized

---

## Test Case 2: HV2_Adidas_LE.pdf

### Input
- Brief text from HV2 PDF

### Expected Behavior
- [ ] "industrial workbenches/stools" → **2 separate assets**:
  - [ ] Asset 1: "Industrial Workbenches" (or similar)
  - [ ] Asset 2: "Stools" (or similar)
- [ ] Racks not mentioned in source → correctly omitted (not extracted)
- [ ] Total asset count should be **~26 assets** (may vary slightly)

### Verification
```bash
POST /api/process-brief
{
  "projectId": "<test-uuid>",
  "briefDescription": "<hv2-extracted-text>",
  "allocationMethod": "ai"
}
```

### Check Response
- [ ] `assets` array contains separate entries for workbenches and stools
- [ ] No asset named "Industrial Workbenches & Stools" (grouped)
- [ ] Asset names match HV1 naming conventions

---

## Test Case 3: HV3_Adidas_LE.pdf

### Input
- Brief text from HV3 PDF

### Expected Behavior
- [ ] "Industrial workbenches and stools" → **2 separate assets**:
  - [ ] Asset 1: "Industrial Workbenches" (or similar)
  - [ ] Asset 2: "Stools" (or similar)
- [ ] Total asset count should be **~26 assets** (may vary slightly)

### Verification
```bash
POST /api/process-brief
{
  "projectId": "<test-uuid>",
  "briefDescription": "<hv3-extracted-text>",
  "allocationMethod": "ai"
}
```

### Check Response
- [ ] `assets` array contains separate entries for workbenches and stools
- [ ] Asset names match HV1 and HV2 naming conventions

---

## Test Case 4: Crew & Talent Granularity

### Input
- Any brief containing: "Event Manager, Crew, Photo/Video Team, 6 Ambassadors, 4 Workshop Leaders"

### Expected Behavior
- [ ] **5 separate assets** (not grouped as "Crew"):
  - [ ] Asset 1: "Event Manager"
  - [ ] Asset 2: "Production Crew" (or "Crew")
  - [ ] Asset 3: "Photo/Video Team"
  - [ ] Asset 4: "Brand Ambassadors" (quantity: 6)
  - [ ] Asset 5: "Workshop Leaders" (quantity: 4)

### Verification
- [ ] No asset named "Event Staff" or "Crew" that groups multiple roles
- [ ] Each role has its own asset entry

---

## Test Case 5: Package/Set Exception

### Input
- Brief containing: "DJ booth package" or "furniture set"

### Expected Behavior
- [ ] Explicit packages/sets remain as **1 asset** (exception to splitting rule)
- [ ] Asset name includes "package" or "set" terminology

### Verification
- [ ] Package/set items are NOT split into individual components
- [ ] Asset name reflects the package nature

---

## Convergence Verification

### Cross-Brief Comparison

After running all three briefs (HV1, HV2, HV3):

- [ ] **Furniture Assets**: All three briefs should extract similar furniture assets with consistent naming
  - [ ] "Industrial Workbenches" appears in all (if mentioned)
  - [ ] "Stools" appears in all (if mentioned)
  - [ ] Naming is consistent (not "workbenches" in one, "Workbenches" in another)

- [ ] **Asset Count**: All three briefs should produce similar total counts (~26 assets, ±5 variance acceptable)

- [ ] **Crew Assets**: All three briefs should extract crew roles consistently
  - [ ] Individual roles separated (not grouped)
  - [ ] Consistent naming across briefs

---

## Performance Checks

- [ ] **Token Usage**: Monitor completion tokens
  - [ ] Expected: 10-20% increase due to more assets
  - [ ] Should remain well under 24,000 token limit
  - [ ] Log token usage for comparison

- [ ] **Processing Time**: Monitor response times
  - [ ] Should remain reasonable (< 60 seconds)
  - [ ] No significant degradation

- [ ] **JSON Parsing**: Verify no parsing errors
  - [ ] All responses parse successfully
  - [ ] No "merged object" repair messages in logs
  - [ ] All assets have required fields (asset_name, specifications, source_text, tags)

---

## Regression Testing

### Existing Functionality
- [ ] Other asset types still extract correctly (LED screens, stages, etc.)
- [ ] Tag assignment still works correctly
- [ ] Source text extraction still captures correct snippets
- [ ] Confidence scores are reasonable (0.7-0.9 range)

### Edge Cases
- [ ] Briefs with no furniture items → no furniture assets extracted
- [ ] Briefs with only one item in a list → extracted as single asset
- [ ] Briefs with explicit packages → remain grouped

---

## Success Criteria

✅ **All tests pass** if:
1. HV1, HV2, HV3 produce consistent asset counts for similar items
2. "Industrial workbenches, stools, and racks" consistently splits into 3 assets
3. Crew roles are separated into individual assets
4. Explicit packages/sets remain grouped as single assets
5. Token usage increase stays under 20%
6. No regression in existing asset extraction quality

---

## Reporting

After testing, document:
- [ ] Actual asset counts for HV1, HV2, HV3
- [ ] Token usage comparison (before vs. after)
- [ ] Any edge cases discovered
- [ ] Recommendations for further improvements

---

**Test Date**: _______________
**Tester**: _______________
**Environment**: Staging / Production
**Status**: ⏳ Pending / ✅ Passed / ❌ Failed

