# PR Plan: Replace "AI" Terminology with Functional Language

## PR Title
**`refactor(ui): Replace "AI" terminology with functional language`**

---

## Phase 1: Justification & Analysis

### Why
To reduce "AI fatigue" and focus users on value and functionality rather than the underlying technology. This makes the tool feel more organic and less gimmicky.

---

## Phase 2: Replacement Table

### User-Facing Strings Found

All instances below are **text-only changes** that appear in the UI (buttons, labels, tooltips, toast messages, etc.). Internal variable names, database columns, and code comments are **excluded**.

---

### File: `src/components/client/NewProject.tsx`

| Line | Current Text | Proposed Replacement | Context |
|------|-------------|---------------------|---------|
| 156 | `AI-Powered Asset Allocation` | `Smart Asset Allocation` | Section header |
| 160 | `Enable AI to intelligently analyze your brief and suggest optimal assets with detailed specifications.` | `Enable smart analysis to automatically identify assets and suggest detailed specifications from your brief.` | Description text |
| 191 | `AI-Powered Allocation` | `Smart Allocation` | Radio button label |
| 192 | `AI analyzes your brief to identify assets with detailed specifications` | `Automatically analyzes your brief to identify assets with detailed specifications` | Radio button description |
| 197-201 | `✨ AI will analyze your brief to identify assets, create detailed specifications, and suggest optimal supplier allocations with confidence scores.` | `✨ The system will analyze your brief to identify assets, create detailed specifications, and suggest optimal supplier allocations with confidence scores.` | Info box text |
| 268 | `AI Processing Brief...` | `Processing Brief...` | Loading state text |

---

### File: `src/components/producer/AIAllocationModal.tsx`

| Line | Current Text | Proposed Replacement | Context |
|------|-------------|---------------------|---------|
| 39 | `AI Asset Analysis` | `Asset Analysis` | Modal title |
| 53 | `AI is analyzing your project...` | `Analyzing your project...` | Loading message |
| 61 | `Click the button below to start AI analysis of your project.` | `Click the button below to start analyzing your project.` | Instruction text |
| 68 | `Start AI Analysis` | `Start Analysis` | Button label |
| 81 | `AI Analysis Complete` | `Analysis Complete` | Results header |
| 95 | `AI Reasoning` | `Analysis Reasoning` | Section header |
| 147 | `Apply AI Suggestions` | `Apply Suggestions` | Button label |

---

### File: `src/components/producer/ProjectModal.tsx`

| Line | Current Text | Proposed Replacement | Context |
|------|-------------|---------------------|---------|
| 154 | `Our AI will analyze the content to extract key information.` | `The system will analyze the content to extract key information.` | Description text |
| 248 | `Review the information extracted by AI and make any necessary adjustments before creating your project.` | `Review the extracted information and make any necessary adjustments before creating your project.` | Instruction text |
| 344 | `AI-Powered Asset Allocation` | `Smart Asset Allocation` | Section header |
| 347 | `This project will use AI-powered allocation to automatically identify and create assets based on your brief. The AI will analyze your requirements and generate detailed asset specifications with confidence scores.` | `This project will use smart allocation to automatically identify and create assets based on your brief. The system will analyze your requirements and generate detailed asset specifications with confidence scores.` | Info box text |
| 485 | `Analyze Brief with AI` | `Analyze Brief` | Button label |
| 490 | `AI will extract project name, client name, budget, deadline, and other details` | `Will extract project name, client name, budget, deadline, and other details` | Helper text |
| 577 | `AI-Powered Allocation` | `Smart Allocation` | Radio button label |
| 578 | `AI analyzes your brief to identify assets with detailed specifications` | `Automatically analyzes your brief to identify assets with detailed specifications` | Radio button description |
| 586 | `✨ AI will analyze your brief to identify assets, create detailed specifications, and suggest optimal supplier allocations with confidence scores.` | `✨ The system will analyze your brief to identify assets, create detailed specifications, and suggest optimal supplier allocations with confidence scores.` | Info box text |

---

### File: `src/components/producer/ProducerDashboardContainer.tsx`

| Line | Current Text | Proposed Replacement | Context |
|------|-------------|---------------------|---------|
| 402 | `AI-powered` | `smart` | Success message (context: "using AI-powered allocation") |
| 719 | `AI analysis failed: ${result.error?.message || 'Unknown error'}` | `Analysis failed: ${result.error?.message || 'Unknown error'}` | Error message |
| 723 | `AI analysis failed. Please try again.` | `Analysis failed. Please try again.` | Error message |
| 746 | `AI suggestions applied successfully! AI allocation is now complete.` | `Suggestions applied successfully! Smart allocation is now complete.` | Success message |
| 749 | `Failed to apply AI suggestions. Please try again.` | `Failed to apply suggestions. Please try again.` | Error message |

---

### File: `src/components/producer/ActiveProjectsGrid.tsx`

| Line | Current Text | Proposed Replacement | Context |
|------|-------------|---------------------|---------|
| 481 | `AI analysis complete! ${populatedCount} field${populatedCount !== 1 ? 's' : ''} auto-populated.` | `Analysis complete! ${populatedCount} field${populatedCount !== 1 ? 's' : ''} auto-populated.` | Success message |
| 483 | `AI analysis complete, but no specific information could be extracted. Please fill in the fields manually.` | `Analysis complete, but no specific information could be extracted. Please fill in the fields manually.` | Warning message |

---

### File: `src/components/producer/AssetManagement.tsx`

| Line | Current Text | Proposed Replacement | Context |
|------|-------------|---------------------|---------|
| 50 | `AI Allocation Applied` | `Smart Allocation Applied` | Status badge |
| 58 | `AI Allocation` | `Smart Allocation` | Button label |
| 68 | `AI Asset Analysis` | `Asset Analysis` | Menu item label |

---

### File: `src/components/ProjectCreationLoadingOverlay.tsx`

| Line | Current Text | Proposed Replacement | Context |
|------|-------------|---------------------|---------|
| 29 | `Running AI analysis` | `Running analysis` | Loading step text |

---

### File: `src/hooks/useProjectManagement.ts`

| Line | Current Text | Proposed Replacement | Context |
|------|-------------|---------------------|---------|
| 170 | `using AI-powered allocation` | `using smart allocation` | Success message |

---

## Phase 3: Impact Analysis

### ✅ Text-Only Changes
All replacements are **purely cosmetic** text changes in user-facing strings.

### ✅ No Logic Changes
- No changes to variable names (`allocationMethod: 'ai'` remains unchanged)
- No changes to API endpoints or request/response structures
- No changes to database schemas or column names
- No changes to component props or function signatures

### ✅ No Breaking Changes
- All changes are in display text only
- Internal code logic remains identical
- Component behavior is unchanged
- API contracts remain the same

### Files Affected
1. `src/components/client/NewProject.tsx` - 6 instances
2. `src/components/producer/AIAllocationModal.tsx` - 7 instances
3. `src/components/producer/ProjectModal.tsx` - 9 instances
4. `src/components/producer/ProducerDashboardContainer.tsx` - 5 instances
5. `src/components/producer/ActiveProjectsGrid.tsx` - 2 instances
6. `src/components/producer/AssetManagement.tsx` - 3 instances
7. `src/components/ProjectCreationLoadingOverlay.tsx` - 1 instance
8. `src/hooks/useProjectManagement.ts` - 1 instance

**Total: 34 user-facing text instances to replace**

---

## Phase 4: Await Approval

**Status:** ⏸️ **AWAITING APPROVAL**

This replacement table is complete and ready for review. Please review each proposed replacement and provide feedback. Once approved, we will proceed with incremental implementation file by file.

---

## Notes

### Replacement Patterns Used:
- `AI-Powered` → `Smart`
- `AI Analysis` → `Analysis`
- `AI is analyzing` → `Analyzing`
- `AI will` → `The system will` / `Will`
- `AI-powered` → `smart`
- `AI suggestions` → `Suggestions`

### Exclusions (Not Changed):
- Internal variable names: `allocationMethod: 'ai'`
- API endpoint paths: `/api/ai-allocate-assets`
- Service file names: `aiAllocationService.ts`
- Component prop types: `allocationMethod: 'static' | 'ai'`
- Code comments (developer-facing only)

