const { supabase } = require('../config/database');

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
        .select('id, asset_id, supplier_id, status, cost')
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

