import { supabase } from '../lib/supabase';
import type { Project, Asset, Supplier } from '../lib/supabase';
import { ASSET_KEYWORDS } from '../constants';

export class AutomationService {
  // Parse brief description to identify required assets
  static parseAssetsFromBrief(briefDescription: string): string[] {

    const brief = briefDescription.toLowerCase();
    const identifiedAssets: string[] = [];

    Object.entries(ASSET_KEYWORDS).forEach(([category, keywords]) => {
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
        createdAssets.push(asset as unknown as Asset);
      }
    }

    return createdAssets;
  }

  // Find relevant suppliers based on asset requirements
  static async findRelevantSuppliers(assetName: string, requiredTags: string[] = []): Promise<Supplier[]> {
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('*');

    if (error || !suppliers) return [];

    // Match suppliers based on service categories
    const assetMatched = suppliers.filter((supplier) => {
      const categories = supplier.service_categories as string[];
      return categories.some((category) => 
        category.toLowerCase().includes(assetName.toLowerCase()) ||
        assetName.toLowerCase().includes(category.toLowerCase())
      );
    });

    if (!requiredTags || requiredTags.length === 0) return assetMatched as unknown as Supplier[];

    const tagsLower = requiredTags.map(t => t.toLowerCase());
    return assetMatched.filter((supplier) => {
      const categories = supplier.service_categories as string[];
      return categories.some((cat) => tagsLower.includes(cat.toLowerCase()));
    }) as unknown as Supplier[];
  }

  // Send quote requests to suppliers (simulated email)
  static async sendQuoteRequestsForAsset(
    asset: Asset,
    requiredTags: string[] = [],
    from: { name: string; email: string } | null = null
  ): Promise<void> {
    const relevantSuppliers = await this.findRelevantSuppliers(asset.asset_name, requiredTags);
    
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
        const fnUrl = import.meta.env.VITE_EMAIL_FUNCTION_URL || '';
        const fnKey = import.meta.env.VITE_EMAIL_FUNCTION_KEY || '';
        const subject = `Quote Request: ${asset.asset_name}`;
        const body = `Please provide a quote for ${asset.asset_name}.\n\nSpecifications: ${asset.specifications || ''}\n\nSubmit here: ${window.location.origin}/quote/${quote.quote_token}`;
        if (fnUrl && fnKey && from) {
          try {
            await fetch(fnUrl, {
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
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Email send failed', e);
          }
        } else {
          // Fallback to console if function not configured
          // eslint-disable-next-line no-console
          console.log(`Email (simulated) to ${supplier.contact_email}: ${subject}`);
        }
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
        .eq('asset_id', (quote as any).asset_id)
        .neq('id', quoteId);

      // Update asset with assigned supplier
      await supabase
        .from('assets')
        .update({ 
          assigned_supplier_id: (quote as any).supplier_id,
          status: 'Approved'
        })
        .eq('id', (quote as any).asset_id);
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