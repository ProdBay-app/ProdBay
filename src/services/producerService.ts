import { getSupabase } from '@/lib/supabase';
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
  quantity?: number;
  tags?: string[];
}

export interface ProducerSettings {
  from_name: string;
  from_email: string;
}

/**
 * AssetWithAcceptedQuote Interface
 * Represents an asset that has an accepted quote, combining data from:
 * - Asset (name, specs, status, etc.)
 * - Quote (cost, cost breakdown, dates)
 * - Supplier (who provided the accepted quote)
 */
export interface AssetWithAcceptedQuote extends Asset {
  acceptedQuote: {
    id: string;
    cost: number;
    cost_breakdown?: {
      labor: number;
      materials: number;
      equipment: number;
      other: number;
    };
    notes_capacity?: string;
    created_at: string;
    updated_at: string;
    supplier: Supplier;
  };
}

export class ProducerService {
  // ===== PROJECT OPERATIONS =====

  /**
   * Load all projects ordered by creation date (newest first)
   */
  static async loadProjects(): Promise<Project[]> {
    const supabase = await getSupabase();
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
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) throw error;
    return data as unknown as Project;
  }

  /**
   * Get a specific project by ID (semantic alias for loadProject)
   * Used primarily by the Project Detail Page for clarity and consistency
   */
  static async getProjectById(projectId: string): Promise<Project | null> {
    return this.loadProject(projectId);
  }

  /**
   * Get all projects for a specific client by client name
   * Returns projects ordered by creation date (newest first)
   * Used for the "View Client Projects" modal
   */
  static async getProjectsByClientName(clientName: string): Promise<Project[]> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('client_name', clientName)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as Project[];
  }

  /**
   * Create a new project
   */
  static async createProject(projectData: ProjectFormData): Promise<Project> {
    const supabase = await getSupabase();
    
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Guard clause: Ensure user is authenticated
    if (userError || !user) {
      throw new Error('You must be logged in to create a project');
    }
    
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        project_name: projectData.project_name,
        client_name: projectData.client_name,
        brief_description: projectData.brief_description,
        physical_parameters: projectData.physical_parameters,
        financial_parameters: projectData.financial_parameters ?? 0,
        timeline_deadline: projectData.timeline_deadline || null,
        project_status: 'New',
        producer_id: user.id // Assign ownership to the current user
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
    const supabase = await getSupabase();
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
   * Update only the brief fields of a project
   * Used for in-place editing of brief description and physical parameters
   */
  static async updateProjectBrief(
    projectId: string,
    briefDescription: string,
    physicalParameters: string
  ): Promise<void> {
    const supabase = await getSupabase();
    const { error } = await supabase
      .from('projects')
      .update({
        brief_description: briefDescription,
        physical_parameters: physicalParameters
      })
      .eq('id', projectId);

    if (error) throw error;
  }

  /**
   * Delete a project and all related data (quotes, assets)
   */
  static async deleteProject(projectId: string): Promise<void> {
    // First, get all assets for this project
    const supabase = await getSupabase();
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
   * Load assets for a specific project with assigned suppliers and quote counts
   * Calculates both total quote count and received quote count (Submitted, Accepted, Rejected)
   */
  static async loadProjectAssets(projectId: string): Promise<Asset[]> {
    const supabase = await getSupabase();
    
    // First, try to fetch assets with quotes including status
    // Note: PostgREST relationship name verification - if this fails, we'll fall back to separate query
    let data: any[] | null = null;
    let error: any = null;
    
    try {
      const result = await supabase
        .from('assets')
        .select(`
          *,
          assigned_supplier:suppliers(*),
          quotes(status)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      
      data = result.data;
      error = result.error;
      
      // If the relationship name is wrong, PostgREST will return an error
      // Check for common error patterns indicating relationship name issues
      if (error && (
        error.message?.includes('relation') || 
        error.message?.includes('column') ||
        error.code === 'PGRST116' // PostgREST error for unknown relation
      )) {
        console.warn('[ProducerService] Quote status aggregation failed, falling back to separate query:', error.message);
        // Fall back to separate query approach
        return await this.loadProjectAssetsWithSeparateQuoteCount(projectId);
      }
      
      if (error) throw error;
      
      // Transform data to calculate both quote counts
      // Received statuses: 'Submitted', 'Accepted', 'Rejected'
      const RECEIVED_STATUSES = ['Submitted', 'Accepted', 'Rejected'];
      
      return (data || []).map((item: any) => {
        let quoteCount = 0;
        let receivedQuoteCount = 0;
        
        // Handle different response formats
        if (Array.isArray(item.quotes)) {
          quoteCount = item.quotes.length;
          // Count quotes with received statuses
          receivedQuoteCount = item.quotes.filter((q: any) => 
            q.status && RECEIVED_STATUSES.includes(q.status)
          ).length;
        } else if (item.quotes && typeof item.quotes === 'object') {
          // If quotes is an object (unexpected format), try to handle it
          console.warn('[ProducerService] Unexpected quotes format:', typeof item.quotes);
        }
        
        // Remove nested quotes array and add counts
        const { quotes, ...assetData } = item;
        return {
          ...assetData,
          quote_count: quoteCount,
          received_quote_count: receivedQuoteCount
        };
      }) as unknown as Asset[];
      
    } catch (err) {
      // If aggregation fails for any reason, fall back to separate query
      console.warn('[ProducerService] Error in quote status aggregation, falling back:', err);
      return await this.loadProjectAssetsWithSeparateQuoteCount(projectId);
    }
  }

  /**
   * Fallback method: Load assets and fetch quote counts separately
   * Used when quote status aggregation via relationship fails
   * Calculates both total quote count and received quote count
   */
  private static async loadProjectAssetsWithSeparateQuoteCount(projectId: string): Promise<Asset[]> {
    const supabase = await getSupabase();
    
    // Fetch assets
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select(`
        *,
        assigned_supplier:suppliers(*)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (assetsError) throw assetsError;
    if (!assets || assets.length === 0) return [];

    // Fetch all quotes for these assets with status in a single query
    const assetIds = assets.map((a: any) => a.id);
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('asset_id, status')
      .in('asset_id', assetIds);

    if (quotesError) {
      console.error('[ProducerService] Error fetching quote counts:', quotesError);
      // Continue without quote counts rather than failing completely
    }

    // Count quotes per asset (total and received)
    // Received statuses: 'Submitted', 'Accepted', 'Rejected'
    const RECEIVED_STATUSES = ['Submitted', 'Accepted', 'Rejected'];
    const quoteCounts = new Map<string, number>();
    const receivedQuoteCounts = new Map<string, number>();
    
    if (quotes) {
      quotes.forEach((quote: any) => {
        const assetId = quote.asset_id;
        
        // Increment total count
        const totalCount = quoteCounts.get(assetId) || 0;
        quoteCounts.set(assetId, totalCount + 1);
        
        // Increment received count if status is received
        if (quote.status && RECEIVED_STATUSES.includes(quote.status)) {
          const receivedCount = receivedQuoteCounts.get(assetId) || 0;
          receivedQuoteCounts.set(assetId, receivedCount + 1);
        }
      });
    }

    // Merge quote counts into assets
    return (assets || []).map((asset: any) => ({
      ...asset,
      quote_count: quoteCounts.get(asset.id) || 0,
      received_quote_count: receivedQuoteCounts.get(asset.id) || 0
    })) as unknown as Asset[];
  }

  /**
   * Get assets for a specific project (semantic alias for loadProjectAssets)
   * Used primarily by the Project Detail Page for clarity and consistency
   */
  static async getAssetsByProjectId(projectId: string): Promise<Asset[]> {
    return this.loadProjectAssets(projectId);
  }

  /**
   * Get all assets with accepted quotes for a specific project
   * Returns only assets that have at least one accepted quote
   * Includes the accepted quote details and supplier information
   * Used for budget breakdown modal and spending analysis
   * 
   * @param projectId - UUID of the project
   * @returns Promise with array of assets that have accepted quotes
   */
  static async getAssetsWithAcceptedQuotes(projectId: string): Promise<AssetWithAcceptedQuote[]> {
    const supabase = await getSupabase();
    
    // Query assets with INNER JOIN to quotes (filtered by status = 'Accepted')
    // This ensures we only get assets that have an accepted quote
    const { data, error } = await supabase
      .from('assets')
      .select(`
        *,
        quotes!inner(
          id,
          cost,
          cost_breakdown,
          notes_capacity,
          created_at,
          updated_at,
          supplier:suppliers(*)
        )
      `)
      .eq('project_id', projectId)
      .eq('quotes.status', 'Accepted')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Transform the data structure to match our interface
    // Supabase returns quotes as an array, but we know each asset only has one accepted quote
    const assetsWithAcceptedQuotes: AssetWithAcceptedQuote[] = (data || []).map((item: any) => {
      // Extract the first (and only) accepted quote
      const acceptedQuote = item.quotes?.[0];
      
      if (!acceptedQuote) {
        throw new Error(`Asset ${item.id} returned without an accepted quote`);
      }

      // Remove the quotes array from the asset object
      const { quotes, ...assetData } = item;

      // Return the transformed object matching AssetWithAcceptedQuote interface
      return {
        ...assetData,
        acceptedQuote: {
          id: acceptedQuote.id,
          cost: acceptedQuote.cost,
          cost_breakdown: acceptedQuote.cost_breakdown,
          notes_capacity: acceptedQuote.notes_capacity,
          created_at: acceptedQuote.created_at,
          updated_at: acceptedQuote.updated_at,
          supplier: acceptedQuote.supplier
        }
      } as AssetWithAcceptedQuote;
    });

    return assetsWithAcceptedQuotes;
  }

  /**
   * Get a specific asset by ID with project details
   * Used for detailed asset views and quote request flows
   */
  static async getAssetById(assetId: string): Promise<Asset> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('assets')
      .select(`
        *,
        project:projects(*),
        assigned_supplier:suppliers(*)
      `)
      .eq('id', assetId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Asset not found');
    
    return data as unknown as Asset;
  }

  /**
   * Create a new asset
   * Returns the newly created asset for immediate UI updates
   */
  static async createAsset(projectId: string, assetData: AssetFormData): Promise<Asset> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('assets')
      .insert({
        project_id: projectId,
        asset_name: assetData.asset_name,
        specifications: assetData.specifications || null,
        timeline: assetData.timeline || null,
        status: assetData.status,
        assigned_supplier_id: assetData.assigned_supplier_id || null,
        quantity: assetData.quantity || null,
        tags: assetData.tags || []
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create asset');
    
    return data as unknown as Asset;
  }

  /**
   * Update an existing asset
   * Returns the updated asset for immediate UI updates
   */
  static async updateAsset(assetId: string, assetData: AssetFormData): Promise<Asset> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('assets')
      .update({
        asset_name: assetData.asset_name,
        specifications: assetData.specifications || null,
        timeline: assetData.timeline || null,
        status: assetData.status,
        assigned_supplier_id: assetData.assigned_supplier_id || null,
        quantity: assetData.quantity || null,
        tags: assetData.tags || []
      })
      .eq('id', assetId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update asset');
    
    return data as unknown as Asset;
  }

  /**
   * Delete an asset and all related quotes
   * Cascade deletion: quotes are deleted first, then the asset
   */
  static async deleteAsset(assetId: string): Promise<void> {
    const supabase = await getSupabase();
    
    // Delete quotes first (cascade)
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

    const supabase = await getSupabase();
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
    const supabase = await getSupabase();
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
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('supplier_name');

    if (error) throw error;
    return (data || []) as unknown as Supplier[];
  }

  /**
   * Get all quotes for a specific asset with populated supplier data
   */
  static async getQuotesForAsset(assetId: string): Promise<Quote[]> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as Quote[];
  }

  /**
   * Request a quote from a supplier for an asset
   * Creates a new quote record with 'Pending' status
   */
  static async requestQuote(assetId: string, supplierId: string): Promise<Quote> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('quotes')
      .insert({
        asset_id: assetId,
        supplier_id: supplierId,
        cost: 0,
        notes_capacity: '',
        status: 'Pending'
      })
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create quote request');
    return data as unknown as Quote;
  }

  // ===== SETTINGS OPERATIONS =====

  /**
   * Load producer settings for email configuration
   */
  static async loadProducerSettings(): Promise<ProducerSettings | null> {
    const supabase = await getSupabase();
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

  /**
   * Accept a quote and enforce exclusivity
   * - Sets the target quote status to 'Accepted'
   * - Sets all other quotes for the same asset to 'Rejected'
   * - Updates the asset with assigned_supplier_id and status 'Approved'
   * 
   * @param quoteId - UUID of the quote to accept
   * @returns Promise with updated quote and asset data
   */
  static async acceptQuote(quoteId: string): Promise<{ quote: Quote; asset: Asset }> {
    const supabase = await getSupabase();
    
    // Get JWT token from Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Authentication required. Please log in.');
    }

    // Get Railway API URL
    const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL || '';
    if (!RAILWAY_API_URL) {
      throw new Error('Railway API URL not configured. Please set VITE_RAILWAY_API_URL environment variable.');
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL.replace(/\/$/, '')}/api/quotes/${quoteId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Invalid response from server');
      }

      return data.data;
    } catch (error) {
      console.error('Error accepting quote:', error);
      throw error instanceof Error ? error : new Error('Failed to accept quote');
    }
  }
}
