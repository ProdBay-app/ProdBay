import { supabase } from '@/lib/supabase';
import type { Project, Asset, Quote, Supplier } from '@/lib/supabase';

export interface ProjectFormData {
  project_name: string;
  client_name: string;
  brief_description: string;
  physical_parameters: string;
  financial_parameters: number | undefined;
  timeline_deadline: string;
}

export interface AssetFormData {
  id?: string;
  asset_name: string;
  specifications: string;
  timeline: string;
  status: Asset['status'];
  assigned_supplier_id?: string;
}

export interface ProducerSettings {
  from_name: string;
  from_email: string;
}

export class ProducerService {
  // ===== PROJECT OPERATIONS =====

  /**
   * Load all projects ordered by creation date (newest first)
   */
  static async loadProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as Project[];
  }

  /**
   * Load a specific project by ID
   */
  static async loadProject(projectId: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) throw error;
    return data as unknown as Project;
  }

  /**
   * Create a new project
   */
  static async createProject(projectData: ProjectFormData): Promise<Project> {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        project_name: projectData.project_name,
        client_name: projectData.client_name,
        brief_description: projectData.brief_description,
        physical_parameters: projectData.physical_parameters,
        financial_parameters: projectData.financial_parameters ?? 0,
        timeline_deadline: projectData.timeline_deadline || null,
        project_status: 'New'
      })
      .select()
      .single();

    if (projectError || !project) {
      throw projectError || new Error('Failed to create project');
    }

    return project as unknown as Project;
  }

  /**
   * Update an existing project
   */
  static async updateProject(projectId: string, projectData: ProjectFormData): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update({
        project_name: projectData.project_name,
        client_name: projectData.client_name,
        brief_description: projectData.brief_description,
        physical_parameters: projectData.physical_parameters,
        financial_parameters: projectData.financial_parameters ?? null,
        timeline_deadline: projectData.timeline_deadline || null
      })
      .eq('id', projectId);

    if (error) throw error;
  }

  /**
   * Delete a project and all related data (quotes, assets)
   */
  static async deleteProject(projectId: string): Promise<void> {
    // First, get all assets for this project
    const { data: assetsToDelete, error: assetsFetchError } = await supabase
      .from('assets')
      .select('id')
      .eq('project_id', projectId);

    if (assetsFetchError) throw assetsFetchError;

    const assetIds = (assetsToDelete || []).map(a => a.id);

    // Delete quotes first (if any)
    if (assetIds.length > 0) {
      await supabase
        .from('quotes')
        .delete()
        .in('asset_id', assetIds);

      // Delete assets
      await supabase
        .from('assets')
        .delete()
        .in('id', assetIds);
    }

    // Finally, delete the project
    const { error: deleteProjectError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (deleteProjectError) throw deleteProjectError;
  }

  // ===== ASSET OPERATIONS =====

  /**
   * Load assets for a specific project with assigned suppliers
   */
  static async loadProjectAssets(projectId: string): Promise<Asset[]> {
    const { data, error } = await supabase
      .from('assets')
      .select(`
        *,
        assigned_supplier:suppliers(*)
      `)
      .eq('project_id', projectId);

    if (error) throw error;
    return (data || []) as unknown as Asset[];
  }

  /**
   * Create a new asset
   */
  static async createAsset(projectId: string, assetData: AssetFormData): Promise<void> {
    const { error } = await supabase
      .from('assets')
      .insert({
        project_id: projectId,
        asset_name: assetData.asset_name,
        specifications: assetData.specifications || null,
        timeline: assetData.timeline || null,
        status: assetData.status,
        assigned_supplier_id: assetData.assigned_supplier_id || null
      });

    if (error) throw error;
  }

  /**
   * Update an existing asset
   */
  static async updateAsset(assetId: string, assetData: AssetFormData): Promise<void> {
    const { error } = await supabase
      .from('assets')
      .update({
        asset_name: assetData.asset_name,
        specifications: assetData.specifications || null,
        timeline: assetData.timeline || null,
        status: assetData.status,
        assigned_supplier_id: assetData.assigned_supplier_id || null
      })
      .eq('id', assetId);

    if (error) throw error;
  }

  /**
   * Delete an asset and all related quotes
   */
  static async deleteAsset(assetId: string): Promise<void> {
    // Delete quotes first
    await supabase
      .from('quotes')
      .delete()
      .eq('asset_id', assetId);

    // Delete the asset
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', assetId);

    if (error) throw error;
  }

  // ===== QUOTE OPERATIONS =====

  /**
   * Load quotes for multiple assets
   */
  static async loadQuotesForAssets(assetIds: string[]): Promise<Quote[]> {
    if (assetIds.length === 0) return [];

    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        supplier:suppliers(*),
        asset:assets(*)
      `)
      .in('asset_id', assetIds);

    if (error) throw error;
    return (data || []) as unknown as Quote[];
  }

  /**
   * Reject a quote
   */
  static async rejectQuote(quoteId: string): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .update({ status: 'Rejected' })
      .eq('id', quoteId);

    if (error) throw error;
  }

  // ===== SUPPLIER OPERATIONS =====

  /**
   * Load all suppliers ordered by name
   */
  static async loadSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('supplier_name');

    if (error) throw error;
    return (data || []) as unknown as Supplier[];
  }

  // ===== SETTINGS OPERATIONS =====

  /**
   * Load producer settings for email configuration
   */
  static async loadProducerSettings(): Promise<ProducerSettings | null> {
    const { data, error } = await supabase
      .from('producer_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      // Settings might not exist yet, return null instead of throwing
      return null;
    }

    return data ? {
      from_name: String(data.from_name),
      from_email: String(data.from_email)
    } : null;
  }

  // ===== COMPOSITE OPERATIONS =====

  /**
   * Load complete project details (project + assets + quotes)
   */
  static async loadProjectDetails(projectId: string): Promise<{
    assets: Asset[];
    quotes: Quote[];
  }> {
    // Load assets with assigned suppliers
    const assets = await this.loadProjectAssets(projectId);

    // Load quotes for all assets in this project
    let quotes: Quote[] = [];
    if (assets.length > 0) {
      const assetIds = assets.map(asset => asset.id);
      quotes = await this.loadQuotesForAssets(assetIds);
    }

    return { assets, quotes };
  }

  /**
   * Get available service categories from suppliers
   */
  static getAvailableTags(suppliers: Supplier[]): string[] {
    return Array.from(
      new Set(
        suppliers
          .flatMap(s => (s.service_categories || []).map(t => (t || '').trim()))
          .filter(Boolean)
      )
    ).sort();
  }
}
