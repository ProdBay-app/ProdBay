import { supabase } from '../lib/supabase';
import type { Project, Asset, Supplier } from '../lib/supabase';

export class AutomationService {
  // Parse brief description to identify required assets
  static parseAssetsFromBrief(briefDescription: string): string[] {
    const assetKeywords = {
      'printing': ['print', 'banner', 'poster', 'flyer', 'brochure', 'signage'],
      'staging': ['stage', 'platform', 'backdrop', 'display'],
      'audio': ['sound', 'speaker', 'microphone', 'audio', 'music'],
      'lighting': ['light', 'lighting', 'illumination', 'led'],
      'catering': ['food', 'catering', 'meal', 'refreshment', 'beverage'],
      'transport': ['transport', 'delivery', 'logistics', 'shipping'],
      'design': ['design', 'graphic', 'branding', 'logo', 'creative']
    };

    const brief = briefDescription.toLowerCase();
    const identifiedAssets: string[] = [];

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

  // Create assets for a project based on brief parsing
  static async createAssetsForProject(projectId: string, briefDescription: string): Promise<Asset[]> {
    const assetNames = this.parseAssetsFromBrief(briefDescription);
    const createdAssets: Asset[] = [];

    for (const assetName of assetNames) {
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

      if (asset && !error) {
        createdAssets.push(asset);
      }
    }

    return createdAssets;
  }

  // Find relevant suppliers based on asset requirements
  static async findRelevantSuppliers(assetName: string): Promise<Supplier[]> {
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('*');

    if (error || !suppliers) return [];

    // Match suppliers based on service categories
    return suppliers.filter(supplier => 
      supplier.service_categories.some(category => 
        category.toLowerCase().includes(assetName.toLowerCase()) ||
        assetName.toLowerCase().includes(category.toLowerCase())
      )
    );
  }

  // Send quote requests to suppliers (simulated email)
  static async sendQuoteRequestsForAsset(asset: Asset): Promise<void> {
    const relevantSuppliers = await this.findRelevantSuppliers(asset.asset_name);
    
    for (const supplier of relevantSuppliers) {
      // Create quote record with unique token
      const { data: quote, error } = await supabase
        .from('quotes')
        .insert({
          supplier_id: supplier.id,
          asset_id: asset.id,
          status: 'Submitted'
        })
        .select()
        .single();

      if (quote && !error) {
        // In a real implementation, this would send an actual email
        console.log(`Email sent to ${supplier.contact_email}:`);
        console.log(`Quote Request for: ${asset.asset_name}`);
        console.log(`Specifications: ${asset.specifications}`);
        console.log(`Quote submission link: ${window.location.origin}/quote/${quote.quote_token}`);
      }
    }

    // Update asset status to Quoting
    await supabase
      .from('assets')
      .update({ status: 'Quoting' })
      .eq('id', asset.id);
  }

  // Process quote acceptance
  static async acceptQuote(quoteId: string): Promise<void> {
    const { data: quote } = await supabase
      .from('quotes')
      .select('*, asset:assets(*)')
      .eq('id', quoteId)
      .single();

    if (quote) {
      // Update quote status
      await supabase
        .from('quotes')
        .update({ status: 'Accepted' })
        .eq('id', quoteId);

      // Reject other quotes for the same asset
      await supabase
        .from('quotes')
        .update({ status: 'Rejected' })
        .eq('asset_id', quote.asset_id)
        .neq('id', quoteId);

      // Update asset with assigned supplier
      await supabase
        .from('assets')
        .update({ 
          assigned_supplier_id: quote.supplier_id,
          status: 'Approved'
        })
        .eq('id', quote.asset_id);
    }
  }

  // Update project status based on asset statuses
  static async updateProjectStatus(projectId: string): Promise<void> {
    const { data: assets } = await supabase
      .from('assets')
      .select('status')
      .eq('project_id', projectId);

    if (!assets || assets.length === 0) return;

    let newStatus: Project['project_status'] = 'New';
    
    const statuses = assets.map(asset => asset.status);
    
    if (statuses.every(status => status === 'Delivered')) {
      newStatus = 'Completed';
    } else if (statuses.some(status => status === 'In Production' || status === 'Approved')) {
      newStatus = 'In Progress';
    } else if (statuses.some(status => status === 'Quoting')) {
      newStatus = 'Quoting';
    }

    await supabase
      .from('projects')
      .update({ project_status: newStatus })
      .eq('id', projectId);
  }
}