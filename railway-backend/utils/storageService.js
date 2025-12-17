const { createClient } = require('@supabase/supabase-js');

/**
 * Storage Service
 * Handles file uploads to Supabase Storage for quote request attachments
 */
class StorageService {
  constructor() {
    // Use service role client for backend operations (bypasses RLS)
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('⚠️  Supabase Storage not configured. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required.');
      this.supabase = null;
    } else {
      this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    }
  }

  /**
   * Upload a quote request attachment to Supabase Storage
   * @param {string} quoteId - UUID of the quote
   * @param {Buffer} fileBuffer - File content as Buffer
   * @param {string} filename - Original filename
   * @param {string} contentType - MIME type (e.g., 'application/pdf')
   * @returns {Promise<{storagePath: string, publicUrl: string}>} Storage path and public URL
   */
  async uploadQuoteRequestAttachment(quoteId, fileBuffer, filename, contentType) {
    if (!this.supabase) {
      throw new Error('Supabase Storage not configured. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required.');
    }

    try {
      // Sanitize filename: remove special characters, keep only alphanumeric, dots, dashes, underscores
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      
      // Generate unique storage path: quote-requests/{quoteId}/{timestamp}-{filename}
      const timestamp = Date.now();
      const storagePath = `quote-requests/${quoteId}/${timestamp}-${sanitizedFilename}`;

      console.log(`[StorageService] Uploading attachment: ${storagePath} (${fileBuffer.length} bytes)`);

      // Upload file to Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('quote-attachments')
        .upload(storagePath, fileBuffer, {
          contentType: contentType || 'application/octet-stream',
          upsert: false, // Don't overwrite existing files
          cacheControl: '3600' // Cache for 1 hour
        });

      if (uploadError) {
        console.error('[StorageService] Upload error:', uploadError);
        throw new Error(`Failed to upload file to Storage: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('quote-attachments')
        .getPublicUrl(storagePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

      console.log(`[StorageService] ✅ Upload successful: ${urlData.publicUrl}`);

      return {
        storagePath,
        publicUrl: urlData.publicUrl
      };
    } catch (error) {
      console.error('[StorageService] Error uploading attachment:', error);
      throw error;
    }
  }

  /**
   * Delete a quote request attachment from Storage
   * @param {string} storagePath - Path to file in Storage
   * @returns {Promise<void>}
   */
  async deleteQuoteRequestAttachment(storagePath) {
    if (!this.supabase) {
      throw new Error('Supabase Storage not configured.');
    }

    try {
      const { error } = await this.supabase.storage
        .from('quote-attachments')
        .remove([storagePath]);

      if (error) {
        console.error('[StorageService] Delete error:', error);
        throw new Error(`Failed to delete file from Storage: ${error.message}`);
      }

      console.log(`[StorageService] ✅ Deleted: ${storagePath}`);
    } catch (error) {
      console.error('[StorageService] Error deleting attachment:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new StorageService();

