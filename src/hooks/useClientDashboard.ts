import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Project, Asset, Quote, Supplier } from '../lib/supabase';

export interface ClientDashboardData {
  projects: Project[];
  selectedProject: Project | null;
  assets: Asset[];
  quotes: Quote[];
  loading: boolean;
}

export interface ClientDashboardCalculations {
  totalCost: number;
  progressPercentage: number;
}

export interface ClientDashboardUtils {
  getStatusIconProps: (status: string) => { icon: string; className: string };
  getStatusColor: (status: string) => string;
  getAcceptedQuoteForAsset: (assetId: string) => Quote | undefined;
}

export interface UseClientDashboardReturn extends ClientDashboardData, ClientDashboardCalculations, ClientDashboardUtils {
  // Actions
  selectProject: (project: Project) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

export const useClientDashboard = (): UseClientDashboardReturn => {
  const [searchParams] = useSearchParams();
  
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedProjectId = searchParams.get('project');

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Handle project selection based on URL params or default to first project
  useEffect(() => {
    if (selectedProjectId && projects.length > 0) {
      const project = projects.find(p => p.id === selectedProjectId);
      if (project) {
        selectProject(project);
      }
    } else if (projects.length > 0 && !selectedProject) {
      selectProject(projects[0]);
    }
  }, [selectedProjectId, projects]);

  // Data fetching functions
  const loadProjects = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDetails = async (projectId: string): Promise<void> => {
    try {
      // Load assets with assigned suppliers
      const { data: assetsData } = await supabase
        .from('assets')
        .select(`
          *,
          assigned_supplier:suppliers(*)
        `)
        .eq('project_id', projectId);

      setAssets(assetsData || []);

      // Load quotes for all assets in this project
      if (assetsData && assetsData.length > 0) {
        const assetIds = assetsData.map(asset => asset.id);
        const { data: quotesData } = await supabase
          .from('quotes')
          .select(`
            *,
            supplier:suppliers(*),
            asset:assets(*)
          `)
          .in('asset_id', assetIds);

        setQuotes(quotesData || []);
      } else {
        setQuotes([]);
      }
    } catch (error) {
      console.error('Error loading project details:', error);
    }
  };

  // Project selection handler
  const selectProject = async (project: Project): Promise<void> => {
    setSelectedProject(project);
    await loadProjectDetails(project.id);
  };

  // Refresh projects data
  const refreshProjects = async (): Promise<void> => {
    await loadProjects();
  };

  // Status utility functions
  const getStatusIconProps = (status: string): { icon: string; className: string } => {
    switch (status) {
      case 'Completed':
      case 'Delivered':
      case 'Approved':
        return { icon: 'CheckCircle', className: 'h-5 w-5 text-green-500' };
      case 'In Progress':
      case 'In Production':
      case 'Quoting':
        return { icon: 'Clock', className: 'h-5 w-5 text-yellow-500' };
      case 'Cancelled':
        return { icon: 'XCircle', className: 'h-5 w-5 text-red-500' };
      default:
        return { icon: 'AlertCircle', className: 'h-5 w-5 text-gray-500' };
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Completed':
      case 'Delivered':
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
      case 'In Production':
      case 'Quoting':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Business calculations
  const calculateTotalCost = (): number => {
    return quotes
      .filter(quote => quote.status === 'Accepted')
      .reduce((total, quote) => total + (quote.cost || 0), 0);
  };

  const getProgressPercentage = (): number => {
    if (assets.length === 0) return 0;
    const completedAssets = assets.filter(asset => asset.status === 'Delivered').length;
    return Math.round((completedAssets / assets.length) * 100);
  };

  // Helper function to get accepted quote for a specific asset
  const getAcceptedQuoteForAsset = (assetId: string): Quote | undefined => {
    return quotes.find(q => q.asset_id === assetId && q.status === 'Accepted');
  };

  return {
    // Data state
    projects,
    selectedProject,
    assets,
    quotes,
    loading,
    
    // Calculated values
    totalCost: calculateTotalCost(),
    progressPercentage: getProgressPercentage(),
    
    // Utility functions
    getStatusIconProps,
    getStatusColor,
    getAcceptedQuoteForAsset,
    
    // Actions
    selectProject,
    refreshProjects
  };
};
