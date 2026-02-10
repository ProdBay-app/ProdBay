const { supabase } = require('../config/database');
const emailService = require('./emailService');

const getPrimaryContact = (supplier) => {
  const contactPersons = Array.isArray(supplier?.contact_persons) ? supplier.contact_persons : [];
  if (contactPersons.length === 0) return null;
  return contactPersons.find((person) => person.is_primary || person.isPrimary) || contactPersons[0];
};

/**
 * Quote Service
 * Handles quote-related business logic
 */
class QuoteService {
  /**
   * Accept a quote and enforce exclusivity
   * - Sets the target quote status to 'Accepted'
   * - Sets all other quotes for the same asset to 'Rejected'
   * - Updates the asset with assigned_supplier_id and status 'Approved'
   * 
   * @param {string} quoteId - UUID of the quote to accept
   * @returns {Promise<Object>} Updated quote and asset data
   */
  static async acceptQuote(quoteId) {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(quoteId)) {
        throw new Error('Invalid quote ID format. Quote IDs must be valid UUIDs.');
      }

      // Fetch the quote with asset_id and supplier_id
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          id,
          asset_id,
          supplier_id,
          status,
          cost,
          supplier:suppliers(
            supplier_name,
            contact_email,
            contact_persons
          ),
          asset:assets(
            id,
            asset_name,
            project:projects(
              id,
              project_name
            )
          )
        `)
        .eq('id', quoteId)
        .single();

      if (quoteError) {
        if (quoteError.code === 'PGRST116') {
          throw new Error('Quote not found');
        }
        throw new Error(`Failed to fetch quote: ${quoteError.message}`);
      }

      if (!quote) {
        throw new Error('Quote not found');
      }

      // Validate quote status
      if (quote.status !== 'Submitted') {
        throw new Error(`Quote cannot be accepted. Current status is '${quote.status}'. Only quotes with status 'Submitted' can be accepted.`);
      }

      // Validate required fields
      if (!quote.asset_id) {
        throw new Error('Quote is missing asset_id');
      }

      if (!quote.supplier_id) {
        throw new Error('Quote is missing supplier_id');
      }

      // Perform batch updates (Supabase doesn't support transactions, but we can use batch operations)
      // Update 1: Set target quote to 'Accepted'
      const { data: updatedQuote, error: updateQuoteError } = await supabase
        .from('quotes')
        .update({ status: 'Accepted' })
        .eq('id', quoteId)
        .select('*')
        .single();

      if (updateQuoteError) {
        throw new Error(`Failed to update quote status: ${updateQuoteError.message}`);
      }

      // Update 2: Set all other quotes for this asset to 'Rejected'
      const { error: rejectQuotesError } = await supabase
        .from('quotes')
        .update({ status: 'Rejected' })
        .eq('asset_id', quote.asset_id)
        .neq('id', quoteId);

      if (rejectQuotesError) {
        // If this fails, we should rollback the accepted quote
        // However, Supabase doesn't support transactions, so we log the error
        console.error('Failed to reject other quotes:', rejectQuotesError);
        // Attempt to rollback the accepted quote
        await supabase
          .from('quotes')
          .update({ status: 'Submitted' })
          .eq('id', quoteId);
        throw new Error(`Failed to reject other quotes: ${rejectQuotesError.message}`);
      }

      // Update 3: Update asset with assigned supplier and status
      const { data: updatedAsset, error: updateAssetError } = await supabase
        .from('assets')
        .update({
          assigned_supplier_id: quote.supplier_id,
          status: 'Approved'
        })
        .eq('id', quote.asset_id)
        .select('*')
        .single();

      if (updateAssetError) {
        // If this fails, we should rollback the quote changes
        // However, Supabase doesn't support transactions, so we log the error
        console.error('Failed to update asset:', updateAssetError);
        // Attempt to rollback the accepted quote
        await supabase
          .from('quotes')
          .update({ status: 'Submitted' })
          .eq('id', quoteId);
        // Attempt to rollback rejected quotes (this is complex without transactions)
        throw new Error(`Failed to update asset: ${updateAssetError.message}`);
      }

      // Side effect 1: Insert system-style producer message into quote chat
      const acceptanceMessage = 'Quote Accepted. Looking forward to working together.';
      const { error: messageInsertError } = await supabase
        .from('messages')
        .insert({
          quote_id: quoteId,
          sender_type: 'PRODUCER',
          content: acceptanceMessage,
          is_read: false
        });

      if (messageInsertError) {
        // Log and continue so acceptance itself is not blocked by notification failures
        console.error('Failed to insert acceptance message:', messageInsertError);
      }

      // Side effect 2: Notify supplier by email
      const primaryContact = getPrimaryContact(quote.supplier);
      const supplierEmail = primaryContact?.email || quote.supplier?.contact_email || null;
      const supplierName = primaryContact?.name || quote.supplier?.supplier_name || 'Supplier';
      const quoteTitle = quote.asset?.asset_name || 'Quote';
      const projectName = quote.asset?.project?.project_name || null;

      if (supplierEmail) {
        const emailResult = await emailService.sendQuoteAcceptedEmail(
          supplierEmail,
          supplierName,
          projectName,
          quoteTitle
        );

        if (!emailResult.success) {
          console.error('Failed to send quote accepted email:', emailResult.error);
        }
      } else {
        console.warn(`No supplier email found for accepted quote ${quoteId}; skipping acceptance email.`);
      }

      return {
        quote: updatedQuote,
        asset: updatedAsset
      };

    } catch (error) {
      console.error('Error in acceptQuote:', error);
      throw error;
    }
  }
}

module.exports = QuoteService;

