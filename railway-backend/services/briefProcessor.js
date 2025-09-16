const { supabase } = require('../config/database');

/**
 * Brief Processor Service
 * Migrated from frontend AutomationService
 */
class BriefProcessor {
  /**
   * Parse brief description to identify required assets
   * @param {string} briefDescription - The project brief text
   * @returns {string[]} Array of identified asset category names
   */
  static parseAssetsFromBrief(briefDescription) {
    const assetKeywords = {
      'printing': ['print', 'poster', 'flyer', 'brochure', 'signage'],
      'graphics': ['graphic', 'creative'],
      'banners': ['banner'],
      'staging': ['stage', 'platform', 'backdrop', 'display'],
      'audio': ['sound', 'speaker', 'microphone', 'audio', 'music'],
      'lighting': ['light', 'lighting', 'illumination', 'led'],
      'catering': ['catering'],
      'food': ['food', 'meal'],
      'beverages': ['beverage', 'refreshment'],
      'design': ['design', 'logo'],
      'branding': ['branding'],
      'marketing': ['marketing'],
      'transport': ['transport', 'shipping'],
      'logistics': ['logistics'],
      'delivery': ['delivery'],
      'photography': ['photo', 'photography', 'picture'],
      'video': ['video', 'film', 'recording'],
      'security': ['security', 'guard']
    };

    const brief = briefDescription.toLowerCase();
    const identifiedAssets = [];

    Object.entries(assetKeywords).forEach(([category, keywords]) => {
      const found = keywords.some(keyword => brief.includes(keyword));
      if (found) {
        identifiedAssets.push(category.charAt(0).toUpperCase() + category.slice(1));
      }
    });

    // Default assets if none identified
    if (identifiedAssets.length === 0) {
      identifiedAssets.push('General Requirements');
    }

    return identifiedAssets;
  }

  /**
   * Create assets for a project based on brief parsing
   * @param {string} projectId - UUID of the project
   * @param {string} briefDescription - The project brief text
   * @returns {Promise<Object[]>} Array of created asset objects
   */
  static async createAssetsForProject(projectId, briefDescription) {
    const assetNames = this.parseAssetsFromBrief(briefDescription);
    const createdAssets = [];

    for (const assetName of assetNames) {
      try {
        const { data: asset, error } = await supabase
          .from('assets')
          .insert({
            project_id: projectId,
            asset_name: assetName,
            specifications: `Requirements for ${assetName.toLowerCase()} based on project brief`,
            status: 'Pending'
          })
          .select()
          .single();

        if (error) {
          console.error(`Failed to create asset ${assetName}:`, error);
          throw new Error(`Failed to create asset: ${error.message}`);
        }

        if (asset) {
          createdAssets.push(asset);
        }
      } catch (error) {
        console.error(`Error creating asset ${assetName}:`, error);
        throw error;
      }
    }

    return createdAssets;
  }

  /**
   * Process a brief and create assets
   * @param {string} projectId - UUID of the project
   * @param {string} briefDescription - The project brief text
   * @returns {Promise<Object>} Processing result with identified assets and created assets
   */
  static async processBrief(projectId, briefDescription) {
    const startTime = Date.now();
    
    try {
      // Validate inputs
      if (!projectId || !briefDescription) {
        throw new Error('Project ID and brief description are required');
      }

      if (typeof projectId !== 'string' || typeof briefDescription !== 'string') {
        throw new Error('Project ID and brief description must be strings');
      }

      // Parse assets from brief
      const identifiedAssets = this.parseAssetsFromBrief(briefDescription);
      
      // Create assets in database
      const createdAssets = await this.createAssetsForProject(projectId, briefDescription);
      
      const processingTime = Date.now() - startTime;

      return {
        projectId,
        identifiedAssets,
        createdAssets,
        processingTime
      };
    } catch (error) {
      console.error('Brief processing failed:', error);
      throw error;
    }
  }
}

module.exports = BriefProcessor;
