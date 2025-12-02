const { supabase } = require('../config/database');
const emailService = require('./emailService');

/**
 * Portal Service
 * Handles business logic for supplier portal and messaging
 */
class PortalService {
  /**
   * Validate access token and find associated quote
   * @param {string} token - Access token (UUID)
   * @returns {Promise<Object>} Quote object with related data
   */
  static async validateAccessToken(token) {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(token)) {
        throw new Error('Invalid access token format');
      }

      // Find quote by access_token
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          supplier:suppliers(*),
          asset:assets(
            *,
            project:projects(
              id,
              project_name,
              producer_id
            )
          )
        `)
        .eq('access_token', token)
        .single();

      if (quoteError || !quote) {
        throw new Error('Quote not found for this access token');
      }

      return quote;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get full portal session data (quote, asset, project, supplier, messages)
   * @param {string} token - Access token
   * @returns {Promise<Object>} Complete session data
   */
  static async getPortalSession(token) {
    try {
      // Validate token and get quote with related data
      const quote = await this.validateAccessToken(token);

      // Fetch all messages for this quote (ordered by created_at)
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('quote_id', quote.id)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        // Don't throw - return empty messages array if fetch fails
      }

      return {
        quote: {
          id: quote.id,
          supplier_id: quote.supplier_id,
          asset_id: quote.asset_id,
          cost: quote.cost,
          notes_capacity: quote.notes_capacity,
          status: quote.status,
          access_token: quote.access_token,
          created_at: quote.created_at,
          updated_at: quote.updated_at
        },
        asset: quote.asset,
        project: quote.asset?.project,
        supplier: quote.supplier,
        messages: messages || []
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send message from supplier via portal
   * @param {string} token - Access token
   * @param {string} content - Message content
   * @returns {Promise<Object>} Created message object
   */
  static async sendSupplierMessage(token, content) {
    try {
      // Validate content
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw new Error('Message content is required');
      }

      if (content.length > 5000) {
        throw new Error('Message content cannot exceed 5000 characters');
      }

      // Validate token and get quote
      const quote = await this.validateAccessToken(token);

      // Insert message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          quote_id: quote.id,
          sender_type: 'SUPPLIER',
          content: content.trim(),
          is_read: false
        })
        .select()
        .single();

      if (messageError || !message) {
        throw new Error('Failed to create message');
      }

      // ============================================
      // Send email notification to Producer
      // Using split query approach for reliability
      // ============================================
      try {
        // Get asset and project info
        const asset = quote.asset;
        const project = quote.asset?.project;
        const supplier = quote.supplier;

        // Validate chain: Quote → Asset → Project
        if (!asset) {
          console.error(`[PortalService] ❌ Broken Chain: Quote ${quote.id} has no Asset linked. Skipping email notification.`);
        } else if (!project) {
          console.error(`[PortalService] ❌ Broken Chain: Quote ${quote.id} → Asset ${asset.id} has no Project linked. Skipping email notification.`);
        } else {
          // Fetch producer separately using producer_id (split query approach)
          const producerId = project.producer_id;
          
          if (!producerId) {
            console.error(`[PortalService] ❌ Broken Chain: Project ${project.id} has no producer_id set. Skipping email notification.`);
          } else {
            // Query 2: Fetch producer separately
            const { data: producer, error: producerError } = await supabase
              .from('producers')
              .select('id, email, full_name, company_name')
              .eq('id', producerId)
              .single();

            if (producerError) {
              console.error('[PortalService] ❌ Producer fetch failed:', {
                producer_id: producerId,
                error: producerError.message
              });
            } else if (!producer || !producer.email) {
              console.error(`[PortalService] ❌ Broken Chain: Project ${project.id} has producer_id ${producerId} but Producer not found or missing email. Skipping email notification.`);
            } else {
              // ✅ Producer found - send email notification
              console.log(`[PortalService] ✅ Found Producer: Email ${producer.email}`);

              // Get supplier info for sender
              const primaryContact = supplier?.contact_persons?.find(cp => cp.is_primary) || 
                                  (supplier?.contact_persons?.length > 0 ? supplier.contact_persons[0] : null);
              const supplierEmail = primaryContact?.email || supplier?.contact_email || 'noreply@prodbay.com';
              const supplierName = primaryContact?.name || supplier?.supplier_name || 'Supplier';

              // Generate portal link for producer (link to quote chat page)
              const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
              const portalLink = `${frontendUrl}/dashboard/quotes/${quote.id}/chat`;

              // Generate message preview (first 100 characters)
              const messagePreview = content.trim().length > 100 ? content.trim().substring(0, 100) : content.trim();

              // Send email notification
              console.log(`[PortalService] 📧 Sending email notification to ${producer.email} (SUPPLIER → PRODUCER)`);
              
              const emailResult = await emailService.sendNewMessageNotification({
                to: producer.email,
                replyTo: supplierEmail,
                senderName: supplierName,
                quoteName: asset?.asset_name || 'Quote',
                portalLink: portalLink,
                messagePreview: messagePreview
              });

              if (emailResult.success) {
                console.log(`[PortalService] ✅ Email notification sent successfully to ${producer.email} (Message ID: ${emailResult.messageId})`);
              } else {
                console.error('[PortalService] ❌ Failed to send email notification:', emailResult.error);
                // Don't throw - message was created successfully
              }
            }
          }
        }
      } catch (emailError) {
        console.error('[PortalService] ❌ Error processing email notification:', emailError);
        // Don't throw - message was created successfully
      }

      return message;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send message from producer (authenticated)
   * @param {string} quoteId - Quote ID
   * @param {string} content - Message content
   * @param {Object} user - Authenticated user object from JWT
   * @returns {Promise<Object>} Created message object
   */
  static async sendProducerMessage(quoteId, content, user) {
    try {
      // Validate inputs
      if (!quoteId || typeof quoteId !== 'string') {
        throw new Error('Quote ID is required');
      }

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw new Error('Message content is required');
      }

      if (content.length > 5000) {
        throw new Error('Message content cannot exceed 5000 characters');
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(quoteId)) {
        throw new Error('Invalid quote ID format');
      }

      // Verify quote exists and get related data
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          supplier:suppliers(*),
          asset:assets(
            *,
            project:projects(*)
          )
        `)
        .eq('id', quoteId)
        .single();

      if (quoteError || !quote) {
        throw new Error('Quote not found');
      }

      // TODO: Verify producer ownership of quote (when producer_id is added to projects)
      // For now, we allow any authenticated user to send messages

      // Insert message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          quote_id: quoteId,
          sender_type: 'PRODUCER',
          content: content.trim(),
          is_read: false
        })
        .select()
        .single();

      if (messageError || !message) {
        throw new Error('Failed to create message');
      }

      // Get supplier email
      const supplier = quote.supplier;
      const supplierEmail = supplier?.contact_email || null;
      const supplierName = supplier?.supplier_name || 'Supplier';

      // Get asset info for email context
      const asset = quote.asset;

      // Generate portal link for supplier
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const portalLink = `${frontendUrl}/portal/quote/${quote.access_token}`;

      // Send email notification to supplier
      if (supplierEmail) {
        try {
          // Get producer email from user or use default
          const producerEmail = user.email || process.env.PRODUCER_EMAIL || 'noreply@prodbay.com';
          const producerName = user.user_metadata?.name || user.email || 'Producer';

          await emailService.sendNewMessageNotification({
            to: supplierEmail,
            replyTo: producerEmail,
            senderName: producerName,
            quoteName: asset?.asset_name || 'Quote',
            portalLink: portalLink,
            messagePreview: content.trim().substring(0, 100)
          });
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Don't throw - message was created successfully
        }
      }

      return message;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get messages for a specific quote (for producer chat view)
   * @param {string} quoteId - Quote ID
   * @returns {Promise<Object>} Quote data with messages, asset, and supplier info
   */
  static async getQuoteMessages(quoteId) {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(quoteId)) {
        throw new Error('Invalid quote ID format');
      }

      // Verify quote exists and get related data
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          supplier:suppliers(*),
          asset:assets(
            *,
            project:projects(*)
          )
        `)
        .eq('id', quoteId)
        .single();

      if (quoteError || !quote) {
        throw new Error('Quote not found');
      }

      // Fetch all messages for this quote (ordered by created_at)
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        // Don't throw - return empty messages array if fetch fails
      }

      return {
        quote: {
          id: quote.id,
          supplier_id: quote.supplier_id,
          asset_id: quote.asset_id,
          cost: quote.cost,
          notes_capacity: quote.notes_capacity,
          status: quote.status,
          access_token: quote.access_token,
          created_at: quote.created_at,
          updated_at: quote.updated_at
        },
        asset: quote.asset,
        project: quote.asset?.project,
        supplier: quote.supplier,
        messages: messages || []
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PortalService;

