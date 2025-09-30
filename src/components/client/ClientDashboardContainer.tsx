import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../hooks/useNotification';
import ClientDashboard from './ClientDashboard';
import type { Project, Asset, Quote } from '../../lib/supabase';

export interface ClientDashboardData {
  projects: Project[];
  selectedProject: Project | null;
  assets: Asset[];
  quotes: Quote[];
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

export interface ClientDashboardActions {
  selectProject: (project: Project) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

export interface ClientDashboardProps extends 
  ClientDashboardData, 
  ClientDashboardCalculations, 
  ClientDashboardUtils, 
  ClientDashboardActions {
  loading: boolean;
  error: string | null;
}

const ClientDashboardContainer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { showError } = useNotification();
  
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load projects';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDetails = async (projectId: string): Promise<void> => {
    try {
      setError(null);
      // Load assets with assigned suppliers
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select(`
          *,
          assigned_supplier:suppliers(*)
        `)
        .eq('project_id', projectId);

      if (assetsError) throw assetsError;
      setAssets(assetsData || []);

      // Load quotes for all assets in this project
      if (assetsData && assetsData.length > 0) {
        const assetIds = assetsData.map(asset => asset.id);
        const { data: quotesData, error: quotesError } = await supabase
          .from('quotes')
          .select(`
            *,
            supplier:suppliers(*),
            asset:assets(*)
          `)
          .in('asset_id', assetIds);

        if (quotesError) throw quotesError;
        setQuotes(quotesData || []);
      } else {
        setQuotes([]);
      }
    } catch (error) {
      console.error('Error loading project details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load project details';
      setError(errorMessage);
      showError(errorMessage);
    }
  };

  // Project selection handler
  const selectProject = async (project: Project): Promise<void> => {
    setSelectedProject(project);
    await loadProjectDetails(project.id);
  };

  // Refresh projects data
  const refreshProjects = async (): Promise<void> => {
    setLoading(true);
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

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Dashboard</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshProjects}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Pass all data and functions to the presentational component
  return (
    <ClientDashboard
      projects={projects}
      selectedProject={selectedProject}
      assets={assets}
      quotes={quotes}
      loading={loading}
      totalCost={calculateTotalCost()}
      progressPercentage={getProgressPercentage()}
      getStatusIconProps={getStatusIconProps}
      getStatusColor={getStatusColor}
      getAcceptedQuoteForAsset={getAcceptedQuoteForAsset}
      selectProject={selectProject}
      refreshProjects={refreshProjects}
    />
  );
};

export default ClientDashboardContainer;
