const { supabase } = require('../config/database');

/**
 * Supplier Service
 * Handles supplier-related operations for the new quote request workflow
 */
class SupplierService {
  /**
   * Log a quote status change to the history table
   * @param {string} quoteId - The quote ID
   * @param {string} status - The new status
   * @param {string} notes - Optional notes about the change
   * @returns {Promise<void>}
   */
  static async logQuoteStatusChange(quoteId, status, notes = null) {
    try {
      console.log(`[AUDIT] Logging quote status change: ${quoteId} -> ${status} (${notes || 'no notes'})`);
      
      const { error } = await supabase
        .from('quote_status_history')
        .insert({
          quote_id: quoteId,
          status: status,
          notes: notes
        });

      if (error) {
        console.error('Failed to log quote status change:', error);
        // Don't throw error - logging failure shouldn't break the main operation
      } else {
        console.log(`[AUDIT] Successfully logged quote status change for ${quoteId}`);
      }
    } catch (error) {
      console.error('Error in logQuoteStatusChange:', error);
      // Don't throw error - logging failure shouldn't break the main operation
    }
  }

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

  /**
   * Submit a quote with ownership validation
   * @param {Object} quoteData - Quote data including supplier_id, asset_id, cost, etc.
   * @returns {Promise<Object>} Created quote
   */
  static async submitQuote(quoteData) {
    try {
      const { supplier_id, asset_id, cost, notes_capacity, status } = quoteData;

      // Validate that supplier exists
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('id, supplier_name')
        .eq('id', supplier_id)
        .single();

      if (supplierError || !supplier) {
        throw new Error(`Supplier not found: ${supplier_id}`);
      }

      // Validate that asset exists
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select('id, asset_name')
        .eq('id', asset_id)
        .single();

      if (assetError || !asset) {
        throw new Error(`Asset not found: ${asset_id}`);
      }

      // Create the quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          supplier_id,
          asset_id,
          cost,
          notes_capacity: notes_capacity || '',
          status: status || 'Submitted'
        })
        .select(`
          *,
          supplier:suppliers(*),
          asset:assets(*)
        `)
        .single();

      if (quoteError) {
        throw new Error(`Failed to create quote: ${quoteError.message}`);
      }

      // Log the initial status change
      console.log(`[AUDIT] About to log initial status change for quote ${quote.id}`);
      await this.logQuoteStatusChange(quote.id, status || 'Submitted', 'Quote submitted by supplier');

      return {
        quote,
        supplier: supplier.supplier_name,
        asset: asset.asset_name
      };

    } catch (error) {
      console.error('Error in submitQuote:', error);
      throw error;
    }
  }

  /**
   * Update a quote with ownership validation
   * @param {string} quoteId - Quote ID to update
   * @param {Object} updateData - Data to update
   * @param {string} impersonatedSupplierId - ID of the impersonated supplier
   * @returns {Promise<Object>} Updated quote
   */
  static async updateQuote(quoteId, updateData, impersonatedSupplierId) {
    try {
      // First, get the quote to validate ownership
      const { data: existingQuote, error: fetchError } = await supabase
        .from('quotes')
        .select('id, supplier_id, supplier:suppliers(supplier_name)')
        .eq('id', quoteId)
        .single();

      if (fetchError || !existingQuote) {
        throw new Error(`Quote not found: ${quoteId}`);
      }

      // Validate ownership
      if (existingQuote.supplier_id !== impersonatedSupplierId) {
        throw new Error(`Ownership violation: Quote belongs to ${existingQuote.supplier.supplier_name}, but you are impersonating a different supplier`);
      }

      // Update the quote
      const { data: updatedQuote, error: updateError } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', quoteId)
        .select(`
          *,
          supplier:suppliers(*),
          asset:assets(*)
        `)
        .single();

      if (updateError) {
        throw new Error(`Failed to update quote: ${updateError.message}`);
      }

      // Log the status change if the status was updated
      if (updateData.status && updateData.status !== existingQuote.status) {
        await this.logQuoteStatusChange(quoteId, updateData.status, 'Quote updated by supplier');
      }

      return {
        quote: updatedQuote,
        supplier: existingQuote.supplier.supplier_name
      };

    } catch (error) {
      console.error('Error in updateQuote:', error);
      throw error;
    }
  }

  /**
   * Get quotable assets for a specific supplier
   * Returns assets for which the supplier has received quote requests with 'Pending' status
   * @param {string} supplierId - The supplier's UUID
   * @returns {Promise<Object>} Object containing assets and metadata
   */
  static async getQuotableAssets(supplierId) {
    try {
      // First, verify the supplier exists
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('id, supplier_name')
        .eq('id', supplierId)
        .single();

      if (supplierError || !supplier) {
        throw new Error(`Supplier not found: ${supplierId}`);
      }

      // Query for assets with pending quote requests for this supplier
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          id,
          asset_id,
          status,
          created_at,
          asset:assets(
            id,
            asset_name,
            specifications,
            timeline,
            status,
            created_at,
            project:projects(
              id,
              project_name,
              client_name,
              brief_description
            )
          )
        `)
        .eq('supplier_id', supplierId)
        .eq('status', 'Pending')
        .order('created_at', { ascending: false });

      if (quotesError) {
        console.error('Error fetching quotable assets:', quotesError);
        throw new Error(`Database connection failed: ${quotesError.message}`);
      }

      // Extract unique assets from the quotes
      const assets = [];
      const seenAssetIds = new Set();

      for (const quote of quotes || []) {
        if (quote.asset && !seenAssetIds.has(quote.asset.id)) {
          seenAssetIds.add(quote.asset.id);
          assets.push({
            id: quote.asset.id,
            asset_name: quote.asset.asset_name,
            specifications: quote.asset.specifications,
            timeline: quote.asset.timeline,
            status: quote.asset.status,
            created_at: quote.asset.created_at,
            project: quote.asset.project,
            quote_request_id: quote.id,
            quote_request_date: quote.created_at
          });
        }
      }

      return {
        supplier: {
          id: supplier.id,
          supplier_name: supplier.supplier_name
        },
        assets: assets,
        total_count: assets.length,
        message: assets.length === 0 
          ? 'No pending quote requests found for this supplier'
          : `Found ${assets.length} assets with pending quote requests`
      };

    } catch (error) {
      console.error('Error in getQuotableAssets:', error);
      throw error;
    }
  }

  /**
   * Get quote status history for a specific quote
   * @param {string} quoteId - The quote's UUID
   * @returns {Promise<Object>} Quote history with chronological status changes
   */
  static async getQuoteHistory(quoteId) {
    try {
      // First, verify the quote exists and get basic info
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          id,
          status,
          supplier:suppliers(id, supplier_name),
          asset:assets(id, asset_name, project:projects(project_name, client_name))
        `)
        .eq('id', quoteId)
        .single();

      if (quoteError || !quote) {
        throw new Error(`Quote not found: ${quoteId}`);
      }

      // Get the status history
      const { data: history, error: historyError } = await supabase
        .from('quote_status_history')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: true });

      if (historyError) {
        console.error('Error fetching quote history:', historyError);
        throw new Error(`Database connection failed: ${historyError.message}`);
      }

      return {
        quote: {
          id: quote.id,
          current_status: quote.status,
          supplier: quote.supplier,
          asset: quote.asset
        },
        history: history || [],
        total_changes: (history || []).length,
        message: (history || []).length === 0 
          ? 'No status changes recorded for this quote'
          : `Found ${(history || []).length} status changes`
      };

    } catch (error) {
      console.error('Error in getQuoteHistory:', error);
      throw error;
    }
  }
}

module.exports = SupplierService;
