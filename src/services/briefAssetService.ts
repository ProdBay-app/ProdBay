import { getSupabase } from '@/lib/supabase';
import type { Asset } from '@/lib/supabase';

/**
 * Service for managing the relationship between manually created assets and the project brief
 * 
 * Features:
 * - Add manually created assets to brief under "Additional Assets" section
 * - Remove manually created assets from brief when deleted
 * - Parse existing brief to identify manually added assets
 * - Only affects manually created assets (source_text is NULL)
 */

export class BriefAssetService {
  /**
   * Add a manually created asset to the brief under "Additional Assets" section
   */
  static async addAssetToBrief(projectId: string, asset: Asset): Promise<void> {
    const supabase = await getSupabase();
    
    // Get current project brief
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('brief_description')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Failed to fetch project brief');
    }

    let briefDescription = project.brief_description || '';
    
    // Check if "Additional Assets" section already exists
    const additionalAssetsHeader = '## Additional Assets';
    const additionalAssetsIndex = briefDescription.indexOf(additionalAssetsHeader);
    
    if (additionalAssetsIndex === -1) {
      // Add "Additional Assets" section at the end
      briefDescription += `\n\n${additionalAssetsHeader}\n`;
    }
    
    // Add the asset to the brief
    const assetEntry = `- **${asset.asset_name}**: ${asset.specifications || 'No specifications provided'}`;
    
    // Find the end of the Additional Assets section
    const endOfSection = briefDescription.indexOf('\n## ', additionalAssetsIndex + additionalAssetsHeader.length);
    const insertPosition = endOfSection === -1 ? briefDescription.length : endOfSection;
    
    // Insert the asset entry
    const beforeSection = briefDescription.substring(0, insertPosition);
    const afterSection = briefDescription.substring(insertPosition);
    
    briefDescription = beforeSection + assetEntry + '\n' + afterSection;
    
    // Update the project brief
    const { error: updateError } = await supabase
      .from('projects')
      .update({ brief_description: briefDescription })
      .eq('id', projectId);

    if (updateError) {
      throw new Error('Failed to update project brief');
    }
  }

  /**
   * Remove a manually created asset from the brief
   */
  static async removeAssetFromBrief(projectId: string, asset: Asset): Promise<void> {
    const supabase = await getSupabase();
    
    // Get current project brief
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('brief_description')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Failed to fetch project brief');
    }

    let briefDescription = project.brief_description || '';
    
    // Find and remove the asset entry
    const assetEntry = `- **${asset.asset_name}**: ${asset.specifications || 'No specifications provided'}`;
    briefDescription = briefDescription.replace(assetEntry + '\n', '').replace(assetEntry, '');
    
    // Check if Additional Assets section is now empty
    const additionalAssetsHeader = '## Additional Assets';
    const additionalAssetsIndex = briefDescription.indexOf(additionalAssetsHeader);
    
    if (additionalAssetsIndex !== -1) {
      // Find the end of the Additional Assets section
      const endOfSection = briefDescription.indexOf('\n## ', additionalAssetsIndex + additionalAssetsHeader.length);
      const sectionEnd = endOfSection === -1 ? briefDescription.length : endOfSection;
      const sectionContent = briefDescription.substring(additionalAssetsIndex, sectionEnd);
      
      // Check if section only contains the header and whitespace
      const contentAfterHeader = sectionContent.substring(additionalAssetsHeader.length).trim();
      if (!contentAfterHeader) {
        // Remove the entire Additional Assets section
        briefDescription = briefDescription.substring(0, additionalAssetsIndex) + 
                         briefDescription.substring(sectionEnd);
      }
    }
    
    // Update the project brief
    const { error: updateError } = await supabase
      .from('projects')
      .update({ brief_description: briefDescription })
      .eq('id', projectId);

    if (updateError) {
      throw new Error('Failed to update project brief');
    }
  }

  /**
   * Check if an asset was manually created (source_text is NULL)
   */
  static isManuallyCreated(asset: Asset): boolean {
    return asset.source_text === null || asset.source_text === undefined;
  }

  /**
   * Get all manually created assets for a project
   */
  static async getManuallyCreatedAssets(projectId: string): Promise<Asset[]> {
    const supabase = await getSupabase();
    
    const { data: assets, error } = await supabase
      .from('assets')
      .select('*')
      .eq('project_id', projectId)
      .is('source_text', null);

    if (error) {
      throw new Error('Failed to fetch manually created assets');
    }

    return assets || [];
  }
}
