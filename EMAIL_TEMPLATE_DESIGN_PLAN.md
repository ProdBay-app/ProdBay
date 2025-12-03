# Email Template Design Plan

## PR Title
`feat(email): implement unified dark-theme HTML template`

## Phase 1: Analysis Summary

### Current Email Implementation

**Email Methods (all plain text):**
1. `sendQuoteRequest` - Quote request to suppliers
2. `sendQuoteReceivedNotification` - Notification to producer when quote is submitted
3. `sendNewMessageNotification` - Chat message notifications

**Current Structure:**
- All emails use `text: emailBody` (plain text)
- No HTML templates
- Basic template literals for body construction
- No branding or styling

### Email Client Compatibility Considerations

**Critical Constraints:**
- **Outlook (Desktop):** Uses Word rendering engine - limited CSS support, no background images in `<body>`, prefers inline styles
- **Gmail:** Strips many CSS classes, prefers inline styles, limited support for `<style>` tags
- **Apple Mail:** Better CSS support, but still prefers inline styles
- **Mobile Clients:** Generally better CSS support, but need responsive design

**Best Practices for Email HTML:**
1. **Inline Styles:** All styles must be inline (no external CSS, minimal `<style>` tags)
2. **Table-Based Layout:** Use `<table>` for layout (not flexbox/grid)
3. **No Dark Mode CSS:** Avoid `@media (prefers-color-scheme: dark)` - unreliable
4. **Background Colors:** Use `bgcolor` attribute on `<td>` elements
5. **Max Width:** 600px for email container (standard email width)
6. **Web Safe Fonts:** Use system fonts or web-safe fonts (Arial, Helvetica, Georgia, etc.)

## Phase 2: Design Strategy

### Color Palette Options

**Option A: Light Mode with Dark Header (Recommended)**
- **Rationale:** Better email client compatibility, especially Outlook
- **Background:** White (`#ffffff`) or Light Gray (`#f5f5f5`)
- **Header/Footer:** Dark (`#0A0A0A` or `#1a1a1a`) with white text
- **Card/Container:** White (`#ffffff`) with subtle border
- **Text:** Dark Gray (`#333333` or `#1a1a1a`)
- **Accent:** Purple (`#7c3aed` or `#8b5cf6`) for buttons and links
- **Borders:** Light Gray (`#e5e5e5`)

**Option B: Full Dark Mode**
- **Rationale:** Matches web app exactly
- **Background:** Dark Gray (`#1a1a1a` or `#0A0A0A`)
- **Card/Container:** Darker Gray (`#222222` or `#2a2a2a`) with border
- **Text:** Light Gray (`#e5e5e5` or `#f5f5f5`)
- **Accent:** Purple (`#7c3aed` or `#8b5cf6`)
- **Borders:** Dark Gray (`#333333`)

**Recommendation: Option A (Light Mode with Dark Header)**
- Better compatibility with Outlook and older email clients
- Higher readability (dark text on light background)
- Dark header provides brand consistency
- Easier to implement and maintain

### Template Structure

```
┌─────────────────────────────────────┐
│  Dark Header (ProdBay Logo/Name)   │
│  Purple accent line                 │
├─────────────────────────────────────┤
│                                     │
│  White Card Container (600px)       │
│  ┌───────────────────────────────┐ │
│  │ Title (Dark Gray)             │ │
│  │                               │ │
│  │ Body Content (Dark Gray)      │ │
│  │ - Paragraphs                  │ │
│  │ - Lists                       │ │
│  │ - Key-Value pairs             │ │
│  │                               │ │
│  │ [Purple CTA Button]           │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│  Dark Footer                        │
│  - Company info                     │
│  - Unsubscribe (if applicable)     │
└─────────────────────────────────────┘
```

### Visual Design Specifications

**Header:**
- Background: `#0A0A0A` (dark)
- Text: `#ffffff` (white)
- Height: ~80px
- Logo/App Name: "ProdBay" in white, bold
- Purple accent line: `#7c3aed`, 4px height

**Card Container:**
- Background: `#ffffff` (white)
- Max Width: 600px
- Padding: 40px (mobile: 20px)
- Border: `#e5e5e5`, 1px (subtle)
- Border Radius: 8px
- Shadow: Subtle (optional, may not render in all clients)

**Typography:**
- Font Family: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- Heading: `#1a1a1a`, 24px, bold
- Body: `#333333`, 16px, line-height 1.6
- Secondary Text: `#666666`, 14px
- Links: `#7c3aed` (purple), underlined

**Button (CTA):**
- Background: `#7c3aed` (purple)
- Text: `#ffffff` (white)
- Padding: 16px 32px
- Border Radius: 6px
- Font: 16px, bold
- Hover: `#6d28d9` (darker purple - may not work in all clients)

**Footer:**
- Background: `#0A0A0A` (dark)
- Text: `#999999` (light gray)
- Font: 12px
- Padding: 30px
- Center aligned

### Responsive Design

**Mobile Breakpoint:** 480px
- Reduce padding to 20px
- Full width container
- Stack elements vertically
- Larger touch targets (buttons min 44px height)

## Phase 3: Implementation Plan

### File Structure

```
railway-backend/
  utils/
    emailGenerator.js  (NEW - shared template generator)
  services/
    emailService.js    (UPDATE - use emailGenerator)
    supplierService.js (UPDATE - use emailGenerator)
```

### Email Generator Function

**Function Signature:**
```javascript
generateEmailHtml({
  title: string,
  body: string | Array<{label: string, value: string}>,  // Can be plain text or key-value pairs
  ctaLink?: string,
  ctaText?: string,
  footerText?: string
}): string
```

**Features:**
- Returns complete HTML email string
- Inline styles only
- Table-based layout
- Responsive design
- Dark header with purple accent
- White card container
- Optional CTA button
- Standard footer

### Email Method Updates

**1. `sendQuoteRequest`:**
- Title: "Quote Request: {assetName}"
- Body: Custom message + quote link
- CTA: "Submit Quote" → quoteLink

**2. `sendQuoteReceivedNotification`:**
- Title: "New Quote Received: {assetName}"
- Body: Key-value pairs (Supplier, Cost, Notes, Document)
- CTA: "View in Dashboard" → dashboardLink

**3. `sendNewMessageNotification`:**
- Title: "New message about {quoteName}"
- Body: Message preview + sender info
- CTA: "View Conversation" → portalLink

### HTML Template Structure

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <!-- Minimal style tag for media queries only -->
  <style>
    @media only screen and (max-width: 480px) {
      .container { width: 100% !important; }
      .card { padding: 20px !important; }
    }
  </style>
</head>
<body>
  <!-- Outer table for email client compatibility -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" bgcolor="#f5f5f5" style="padding: 20px 0;">
        <!-- Header -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td bgcolor="#0A0A0A" style="padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">
                ProdBay
              </h1>
            </td>
          </tr>
          <tr>
            <td bgcolor="#7c3aed" style="height: 4px;"></td>
          </tr>
        </table>
        
        <!-- Card Container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="border: 1px solid #e5e5e5; border-radius: 8px;">
          <tr>
            <td style="padding: 40px;">
              <!-- Title -->
              <h2 style="color: #1a1a1a; font-size: 24px; font-weight: bold; margin: 0 0 20px 0;">
                {title}
              </h2>
              
              <!-- Body Content -->
              <div style="color: #333333; font-size: 16px; line-height: 1.6;">
                {body}
              </div>
              
              <!-- CTA Button (if provided) -->
              {if ctaLink}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{ctaLink}" style="display: inline-block; padding: 16px 32px; background-color: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      {ctaText}
                    </a>
                  </td>
                </tr>
              </table>
              {/if}
            </td>
          </tr>
        </table>
        
        <!-- Footer -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td bgcolor="#0A0A0A" style="padding: 30px; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0; line-height: 1.5;">
                {footerText || 'ProdBay - Production Management Platform'}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## Phase 4: Color Palette Decision

### Recommended: Light Mode with Dark Header

**Rationale:**
1. **Better Compatibility:** Works in all email clients, including Outlook
2. **Higher Readability:** Dark text on light background is easier to read
3. **Brand Consistency:** Dark header maintains brand identity
4. **Professional:** Clean, modern appearance
5. **Accessibility:** Better contrast ratios

**Color Values:**
- Header Background: `#0A0A0A`
- Header Text: `#ffffff`
- Accent Color: `#7c3aed`
- Card Background: `#ffffff`
- Card Border: `#e5e5e5`
- Primary Text: `#1a1a1a`
- Secondary Text: `#333333`
- Tertiary Text: `#666666`
- Footer Background: `#0A0A0A`
- Footer Text: `#999999`
- Button Background: `#7c3aed`
- Button Text: `#ffffff`
- Link Color: `#7c3aed`

### Alternative: Full Dark Mode (If Preferred)

If you prefer full dark mode despite compatibility concerns:
- Background: `#1a1a1a`
- Card: `#2a2a2a`
- Text: `#e5e5e5`
- Border: `#333333`
- Same purple accent: `#7c3aed`

**Note:** Full dark mode may render poorly in Outlook and some email clients.

## Phase 5: Testing Checklist

- [ ] Template renders correctly in Gmail (web)
- [ ] Template renders correctly in Outlook (desktop)
- [ ] Template renders correctly in Apple Mail
- [ ] Template renders correctly on mobile (iOS Mail, Gmail app)
- [ ] All links work correctly
- [ ] CTA buttons are clickable
- [ ] Responsive design works on mobile
- [ ] Text is readable (good contrast)
- [ ] Brand colors are consistent
- [ ] Footer displays correctly

## Summary

**Design Choice:** Light Mode with Dark Header (Option A)
- Best compatibility
- Professional appearance
- Brand consistency via dark header
- High readability

**Implementation:**
- Create `emailGenerator.js` utility
- Update all email methods to use HTML template
- Maintain plain text fallback for accessibility
- Test across major email clients

**Next Steps:**
1. Confirm color palette choice (Light with Dark Header vs Full Dark Mode)
2. Approve template structure
3. Implement email generator
4. Update email service methods
5. Test in email clients

