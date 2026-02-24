# Two-Phase Brief and Asset Analysis

This document explains how ProdBay analyzes your event brief and turns it into a list of assets. The process runs in two steps to improve consistency and avoid missing items.

---

## Overview

When you click "Analyze Brief," the system:

1. **Phase 1 (Extraction):** Reads your brief and lists every item, piece of equipment, service, or role mentioned. Output is a simple list of names, quantities, and where each item appeared in the text.

2. **Phase 2 (Enrichment):** Takes that list and adds details for each item: technical specs, supplier context (e.g., indoor/outdoor, delivery needs), and a category tag.

3. **Merge:** Combines the two results into the final asset list you see.

If either phase fails, the system retries the full flow once. If it still fails, you see "Brief analysis failed. Please try again."

---

## Step-by-Step Flow

```
Your Brief
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE 1: EXTRACTION                                    │
│  • Read the brief                                       │
│  • List every asset mentioned (name, quantity, source)   │
│  • Keep groupings as written (e.g. "6 Chefs + assistants"│
│    stays as one item)                                   │
│  • Do not invent items (no cables, trash bags, etc.)     │
└─────────────────────────────────────────────────────────┘
    │
    ▼  Simple list of ~30–40 items
    │
┌─────────────────────────────────────────────────────────┐
│  PHASE 2: ENRICHMENT                                    │
│  • Take the list from Phase 1                           │
│  • For each item, add:                                  │
│    - Technical specifications                          │
│    - Supplier context (delivery, indoor/outdoor, etc.)   │
│    - Category tag (from the 15 predefined tags)         │
│  • Return one enriched object per input item, same order│
└─────────────────────────────────────────────────────────┘
    │
    ▼  Enriched list
    │
┌─────────────────────────────────────────────────────────┐
│  MERGE                                                  │
│  • Combine Phase 1 (names, quantities, source text)     │
│    with Phase 2 (specs, context, tags)                  │
│  • Validate counts match                                │
└─────────────────────────────────────────────────────────┘
    │
    ▼
Final Asset List
```

---

## Why Two Phases?

Previously, a single step did everything at once: find items, split or group them, write specs, write supplier context, assign categories, and format JSON. For long briefs, the model would sometimes "run out of attention" and skip smaller items near the end (e.g., drink coupons, art curator).

Splitting into two phases:

- **Phase 1** focuses only on finding and listing. Minimal output, so nothing gets dropped.
- **Phase 2** focuses only on adding details to a fixed list. No searching—just enrich each item in order.

---

## Full Prompts Sent to the LLM

### Phase 1

**System message (instructions that define the model's role):**

```
You are a meticulous Data Extraction Specialist. Your ONLY job is to read an event brief and extract an exhaustive list of every physical item, piece of equipment, service, or crew role. KEEP groupings as written—do not split items joined by +, and, or slashes into separate assets. Respond with JSON only—no markdown, no code blocks.
```

**User message (the actual request with your brief):**

```
Extract every asset from this event brief. Return ONLY valid JSON.

RULES:
- Extract every bullet under ASSETS REQUIRED, STAFF & TALENT, MERCH & GIVEAWAYS, FURNITURE & DÉCOR. Do not miss a single item.
- KEEP groupings as written: when items are joined by "+", "and", or slashes, keep them as ONE asset (e.g., "6 Grill Chefs + kitchen assistants" → one asset; "LED signage + lighting truss" → one asset).
- Do NOT split composite items into separate assets. Preserve the brief's structure.
- Do NOT deconstruct single systems (e.g., keep "Projection mapping system" as one item).
- Do NOT invent support items (no cables, trash bags, lighting control system).

Respond ONLY with: { "assets": [ { "asset_name": "string", "quantity": "string", "source_text": "string" } ] }

Event Brief:
"[Your brief text is inserted here]"
```

---

### Phase 2

**System message:**

```
You are a Senior Production Controller. I will provide an array of event assets and the original brief. Your job is to enrich each asset with Technical Specifications, Supplier Context, and Category Tag. Return one object per input asset, in the same order. Respond with JSON only.
```

**User message:**

```
Enrich each asset below with technical specifications, supplier context, and category tag.

RULES:
- Return ONE object for EVERY asset in the input array, in the SAME ORDER. Do not add or remove any.
- Use ONLY these category tags (match exactly): Audio, Video & Display, Photography, Graphics & Signage, Lighting, Staging, Catering, Staffing, Logistics, Branding & Marketing, Floral & Decor, Furniture, Technology, Medical, Scenic & Props
- Provide procurement-ready technical specifications based on the brief.
- Every asset MUST have non-empty supplier_context (e.g., "Outdoor, delivery by Jan 14").

Respond ONLY with: { "enriched_assets": [ { "asset_name": "string", "category_tag": "string", "technical_specifications": "string", "supplier_context": "string" } ] }

Brief context:
- Budget: [From project: financial_parameters or "Not specified"]
- Timeline: [From project: timeline_deadline or "Not specified"]
- Venue: [From project: physical_parameters or "Not specified"]

Event Brief (full): "[Your complete brief text]"

Input assets to enrich (in order):
[JSON array of Phase 1 assets, e.g. [{"asset_name":"Modular grill","quantity":"1","source_text":"..."}, ...]]
```

---

## Model Settings

- **Model:** gpt-4.1-nano
- **Temperature:** 0 (fully deterministic)
- **Phase 1 max output:** 8,000 tokens
- **Phase 2 max output:** 24,000 tokens
- **Output format:** JSON only (enforced by API)

---

## Logging

The full raw output from both phases is logged in your deploy logs under:

- `[Two-Phase] Phase 1 raw LLM output:`
- `[Two-Phase] Phase 2 raw LLM output:`

Use these for debugging and analysis.
