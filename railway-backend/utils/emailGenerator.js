/**
 * Email Generator Utility
 * Generates branded HTML email templates with dark header and light content
 * 
 * Design: Light Mode with Dark Header (Option A)
 * - Better email client compatibility (especially Outlook)
 * - High readability
 * - Brand consistency via dark header
 */

/**
 * Generate HTML email template
 * @param {Object} options - Email template options
 * @param {string} options.title - Email title/heading
 * @param {string|Array} options.body - Email body content (plain text, HTML string, or array of key-value pairs)
 * @param {string} [options.ctaLink] - Call-to-action button link (optional)
 * @param {string} [options.ctaText] - Call-to-action button text (optional)
 * @param {string} [options.footerText] - Custom footer text (optional, defaults to "ProdBay - Production Management Platform")
 * @returns {string} Complete HTML email string
 */
function generateEmailHtml({ title, body, ctaLink, ctaText, footerText }) {
  // Validate required parameters
  if (!title) {
    throw new Error('Title is required for email template');
  }
  if (!body) {
    throw new Error('Body is required for email template');
  }

  // Process body content
  let bodyHtml = '';
  
  if (typeof body === 'string') {
    // Plain text or HTML string - convert newlines to <br> if plain text
    if (body.includes('<') && body.includes('>')) {
      // Assume HTML if contains HTML tags
      bodyHtml = body;
    } else {
      // Plain text - preserve line breaks
      bodyHtml = body.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed === '') return '<br>';
        return `<p style="margin: 0 0 12px 0; color: #333333; font-size: 16px; line-height: 1.6;">${escapeHtml(trimmed)}</p>`;
      }).join('');
    }
  } else if (Array.isArray(body)) {
    // Array of key-value pairs
    bodyHtml = body.map(item => {
      const label = escapeHtml(item.label || '');
      const value = escapeHtml(item.value || '');
      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
          <tr>
            <td style="padding: 0;">
              <p style="margin: 0 0 4px 0; color: #666666; font-size: 14px; font-weight: 600;">${label}</p>
              <p style="margin: 0; color: #1a1a1a; font-size: 16px; line-height: 1.6;">${value}</p>
            </td>
          </tr>
        </table>
      `;
    }).join('');
  }

  // Generate CTA button HTML if provided
  let ctaHtml = '';
  if (ctaLink && ctaText) {
    ctaHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
        <tr>
          <td align="center" style="padding: 0;">
            <a href="${escapeHtml(ctaLink)}" style="display: inline-block; padding: 16px 32px; background-color: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              ${escapeHtml(ctaText)}
            </a>
          </td>
        </tr>
      </table>
    `;
  }

  // Default footer text
  const finalFooterText = footerText || 'ProdBay - Production Management Platform';

  // Generate complete HTML email
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
  <style type="text/css">
    @media only screen and (max-width: 480px) {
      .container { width: 100% !important; }
      .card { padding: 20px !important; }
      .header-padding { padding: 20px !important; }
      .footer-padding { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Outer wrapper table -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5f5f5" style="padding: 20px 0;">
    <tr>
      <td align="center" style="padding: 0;">
        <!-- Header -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td bgcolor="#0A0A0A" style="padding: 30px; text-align: center;" class="header-padding">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                ProdBay
              </h1>
            </td>
          </tr>
          <tr>
            <td bgcolor="#7c3aed" style="height: 4px; padding: 0; line-height: 4px; font-size: 4px;">
              &nbsp;
            </td>
          </tr>
        </table>
        
        <!-- Card Container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width: 600px; width: 100%; border: 1px solid #e5e5e5; border-radius: 8px; margin-top: 0;">
          <tr>
            <td style="padding: 40px;" class="card">
              <!-- Title -->
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: bold; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.3;">
                ${escapeHtml(title)}
              </h2>
              
              <!-- Body Content -->
              <div style="color: #333333; font-size: 16px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                ${bodyHtml}
              </div>
              
              <!-- CTA Button -->
              ${ctaHtml}
            </td>
          </tr>
        </table>
        
        <!-- Footer -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; margin-top: 0;">
          <tr>
            <td bgcolor="#0A0A0A" style="padding: 30px; text-align: center;" class="footer-padding">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                ${escapeHtml(finalFooterText)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (typeof text !== 'string') {
    return String(text);
  }
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, m => map[m]);
}

module.exports = {
  generateEmailHtml
};

