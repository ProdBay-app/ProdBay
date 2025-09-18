const { supabase } = require('../config/database');

/**
 * Supplier Service
 * Handles supplier-related operations for the new quote request workflow
 */
class SupplierService {
  /**
   * Find relevant suppliers based on asset requirements
   * @param {string} assetName - Name of the asset
   * @param {string[]} requiredTags - Optional tags for filtering
   * @returns {Promise<Object[]>} Array of relevant suppliers
   */
  static async findRelevantSuppliers(assetName, requiredTags = []) {
    try {
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('supplier_name');

      if (error) {
        console.error('Error fetching suppliers:', error);
        throw new Error(`Failed to fetch suppliers: ${error.message}`);
      }

      if (!suppliers) return [];

      // Match suppliers based on service categories
      const assetMatched = suppliers.filter((supplier) => 
        (supplier.service_categories || []).some((category) => 
          category.toLowerCase().includes(assetName.toLowerCase()) ||
          assetName.toLowerCase().includes(category.toLowerCase())
        )
      );

      // If no specific tags required, return all asset-matched suppliers
      if (!requiredTags || requiredTags.length === 0) {
        return assetMatched;
      }

      // Filter by required tags
      const tagsLower = requiredTags.map(t => t.toLowerCase());
      return assetMatched.filter((supplier) =>
        (supplier.service_categories || []).some((cat) => 
          tagsLower.includes(cat.toLowerCase())
        )
      );
    } catch (error) {
      console.error('Error in findRelevantSuppliers:', error);
      throw error;
    }
  }

  /**
   * Get suggested suppliers for an asset
   * @param {string} assetId - UUID of the asset
   * @returns {Promise<Object>} Asset details and suggested suppliers
   */
  static async getSuggestedSuppliers(assetId) {
    try {
      // Validate assetId format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(assetId)) {
        throw new Error('Invalid asset ID format');
      }

      // Fetch asset details
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (assetError) {
        console.error('Error fetching asset:', assetError);
        throw new Error(`Asset not found: ${assetError.message}`);
      }

      if (!asset) {
        throw new Error('Asset not found');
      }

      // Get relevant suppliers
      const relevantSuppliers = await this.findRelevantSuppliers(asset.asset_name);

      // Check which suppliers already have quotes for this asset
      const { data: existingQuotes, error: quotesError } = await supabase
        .from('quotes')
        .select('supplier_id')
        .eq('asset_id', assetId);

      if (quotesError) {
        console.error('Error fetching existing quotes:', quotesError);
        // Continue without filtering - better to show all suppliers
      }

      const contactedSupplierIds = new Set(
        (existingQuotes || []).map(quote => quote.supplier_id)
      );

      // Mark suppliers as already contacted
      const suppliersWithStatus = relevantSuppliers.map(supplier => ({
        ...supplier,
        already_contacted: contactedSupplierIds.has(supplier.id)
      }));

      return {
        asset,
        suggestedSuppliers: suppliersWithStatus
      };
    } catch (error) {
      console.error('Error in getSuggestedSuppliers:', error);
      throw error;
    }
  }

  /**
   * Generate email previews for quote requests
   * @param {string} assetId - UUID of the asset
   * @param {string[]} supplierIds - Array of supplier IDs to contact
   * @param {Object} from - Sender information {name, email}
   * @returns {Promise<Object>} Email previews for each supplier
   */
  static async generateEmailPreviews(assetId, supplierIds, from = null) {
    try {
      // Validate inputs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(assetId)) {
        throw new Error('Invalid asset ID format');
      }

      if (!Array.isArray(supplierIds) || supplierIds.length === 0) {
        throw new Error('Supplier IDs array is required and cannot be empty');
      }

      // Validate all supplier IDs
      for (const supplierId of supplierIds) {
        if (!uuidRegex.test(supplierId)) {
          throw new Error(`Invalid supplier ID format: ${supplierId}`);
        }
      }

      // Fetch asset details
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (assetError || !asset) {
        throw new Error('Asset not found');
      }

      // Fetch supplier details
      const { data: suppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .in('id', supplierIds);

      if (suppliersError) {
        throw new Error(`Failed to fetch suppliers: ${suppliersError.message}`);
      }

      if (!suppliers || suppliers.length !== supplierIds.length) {
        throw new Error('One or more suppliers not found');
      }

      // Generate email previews
      const emailPreviews = suppliers.map(supplier => {
        const primaryContact = this.getPrimaryContact(supplier);
        const contactName = primaryContact?.name || supplier.supplier_name;
        const contactEmail = primaryContact?.email || supplier.contact_email;
        
        const subject = `Quote Request: ${asset.asset_name}`;
        const body = this.generateEmailBody(asset, contactName, from);

        return {
          id: supplier.id,
          supplier_name: supplier.supplier_name,
          contact_email: supplier.contact_email,
          contact_persons: supplier.contact_persons || [],
          preview_email: {
            to: contactEmail,
            subject,
            body
          }
        };
      });

      return {
        success: true,
        asset,
        suppliers: emailPreviews
      };
    } catch (error) {
      console.error('Error in generateEmailPreviews:', error);
      throw error;
    }
  }

  /**
   * Get primary contact person from supplier
   * @param {Object} supplier - Supplier object
   * @returns {Object|null} Primary contact person or null
   */
  static getPrimaryContact(supplier) {
    if (!supplier.contact_persons || supplier.contact_persons.length === 0) {
      return null;
    }
    
    return supplier.contact_persons.find(person => person.is_primary) || 
           supplier.contact_persons[0];
  }

  /**
   * Generate email body template
   * @param {Object} asset - Asset details
   * @param {string} contactName - Contact person name
   * @param {Object} from - Sender information
   * @returns {string} Email body
   */
  static generateEmailBody(asset, contactName, from = null) {
    const fromName = from?.name || '[Your Name]';
    const fromEmail = from?.email || '[Your Email]';
    
    return `Dear ${contactName},

We would like to request a quote for the following asset:

Asset: ${asset.asset_name}
Specifications: ${asset.specifications || 'See project brief for details'}
Timeline: ${asset.timeline || 'To be discussed'}

Please provide your quote by visiting the link below and submitting your proposal.

Thank you for your time and we look forward to working with you.

Best regards,
${fromName}
${fromEmail}`;
  }

  /**
   * Send quote requests to selected suppliers
   * @param {string} assetId - UUID of the asset
   * @param {string[]} supplierIds - Array of supplier IDs to contact
   * @param {Object} from - Sender information {name, email}
   * @param {Array} customizedEmails - Array of customized email content
   * @returns {Promise<Object>} Result of quote request sending
   */
  static async sendQuoteRequests(assetId, supplierIds, from = null, customizedEmails = null) {
    try {
      // Validate inputs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(assetId)) {
        throw new Error('Invalid asset ID format');
      }

      if (!Array.isArray(supplierIds) || supplierIds.length === 0) {
        throw new Error('Supplier IDs array is required and cannot be empty');
      }

      // Validate all supplier IDs
      for (const supplierId of supplierIds) {
        if (!uuidRegex.test(supplierId)) {
          throw new Error(`Invalid supplier ID format: ${supplierId}`);
        }
      }

      // Fetch asset details
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (assetError || !asset) {
        throw new Error('Asset not found');
      }

      // Fetch supplier details
      const { data: suppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .in('id', supplierIds);

      if (suppliersError) {
        throw new Error(`Failed to fetch suppliers: ${suppliersError.message}`);
      }

      if (!suppliers || suppliers.length !== supplierIds.length) {
        throw new Error('One or more suppliers not found');
      }

      const results = [];
      const errors = [];

      // Create quote records and send requests
      for (const supplier of suppliers) {
        try {
          // Create quote record
          const { data: quote, error: quoteError } = await supabase
            .from('quotes')
            .insert({
              supplier_id: supplier.id,
              asset_id: assetId,
              status: 'Submitted'
            })
            .select()
            .single();

          if (quoteError) {
            console.error(`Failed to create quote for supplier ${supplier.id}:`, quoteError);
            errors.push({
              supplier_id: supplier.id,
              supplier_name: supplier.supplier_name,
              error: `Failed to create quote: ${quoteError.message}`
            });
            continue;
          }

          // Send email notification (if configured)
          if (from && from.name && from.email) {
            try {
              // Find customized email content for this supplier
              const customizedEmail = customizedEmails?.find(email => email.supplierId === supplier.id);
              
              const emailResult = await this.sendQuoteRequestEmail(
                supplier,
                asset,
                quote,
                from,
                customizedEmail
              );
              results.push({
                supplier_id: supplier.id,
                supplier_name: supplier.supplier_name,
                quote_id: quote.id,
                email_sent: emailResult.success,
                email_error: emailResult.error
              });
            } catch (emailError) {
              console.error(`Email send failed for supplier ${supplier.id}:`, emailError);
              results.push({
                supplier_id: supplier.id,
                supplier_name: supplier.supplier_name,
                quote_id: quote.id,
                email_sent: false,
                email_error: emailError.message
              });
            }
          } else {
            // No email configuration, just log
            console.log(`Quote request created for ${supplier.supplier_name} (${supplier.contact_email})`);
            results.push({
              supplier_id: supplier.id,
              supplier_name: supplier.supplier_name,
              quote_id: quote.id,
              email_sent: false,
              email_error: 'No email configuration provided'
            });
          }
        } catch (error) {
          console.error(`Error processing supplier ${supplier.id}:`, error);
          errors.push({
            supplier_id: supplier.id,
            supplier_name: supplier.supplier_name,
            error: error.message
          });
        }
      }

      // Update asset status to Quoting
      await supabase
        .from('assets')
        .update({ status: 'Quoting' })
        .eq('id', assetId);

      return {
        success: true,
        asset_id: assetId,
        total_requests: supplierIds.length,
        successful_requests: results.length,
        failed_requests: errors.length,
        results,
        errors
      };
    } catch (error) {
      console.error('Error in sendQuoteRequests:', error);
      throw error;
    }
  }

  /**
   * Send quote request email to supplier
   * @param {Object} supplier - Supplier details
   * @param {Object} asset - Asset details
   * @param {Object} quote - Quote record
   * @param {Object} from - Sender information
   * @param {Object} customizedEmail - Customized email content
   * @returns {Promise<Object>} Email send result
   */
  static async sendQuoteRequestEmail(supplier, asset, quote, from, customizedEmail = null) {
    try {
      const fnUrl = process.env.EMAIL_FUNCTION_URL;
      const fnKey = process.env.EMAIL_FUNCTION_KEY;

      if (!fnUrl || !fnKey) {
        return {
          success: false,
          error: 'Email function not configured'
        };
      }

      // Use customized email content if provided, otherwise generate default
      let subject, body;
      
      if (customizedEmail) {
        subject = customizedEmail.subject;
        body = customizedEmail.body;
        
        // Add quote link to the body if not already present
        const quoteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/quote/${quote.quote_token}`;
        if (!body.includes(quoteLink)) {
          body += `\n\nPlease provide your quote by visiting: ${quoteLink}`;
        }
      } else {
        // Generate default email content
        const primaryContact = this.getPrimaryContact(supplier);
        const contactName = primaryContact?.name || supplier.supplier_name;
        
        subject = `Quote Request: ${asset.asset_name}`;
        body = this.generateEmailBody(asset, contactName, from);
        
        // Add quote link
        body += `\n\nPlease provide your quote by visiting: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/quote/${quote.quote_token}`;
      }

      const response = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${fnKey}`
        },
        body: JSON.stringify({
          from: `${from.name} <${from.email}>`,
          to: supplier.contact_email,
          subject,
          text: body
        })
      });

      if (!response.ok) {
        throw new Error(`Email service returned ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = SupplierService;
