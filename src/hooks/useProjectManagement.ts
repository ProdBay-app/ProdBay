import { useState, useEffect, useCallback } from 'react';
import { ProducerService, type ProjectFormData } from '@/services/producerService';
import { RailwayApiService } from '@/services/railwayApiService';
import { useNotification } from './useNotification';
import type { Project } from '@/lib/supabase';

export interface UseProjectManagementReturn {
  // State
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  showProjectModal: boolean;
  isEditingProject: boolean;
  isSubmittingProject: boolean;
  projectForm: ProjectFormData;
  allocationMethod: 'static' | 'ai';
  
  // Actions
  loadProjects: () => Promise<void>;
  selectProject: (project: Project | null) => void;
  openCreateProject: () => void;
  openEditProject: () => void;
  closeProjectModal: () => void;
  updateProjectForm: (field: keyof ProjectFormData, value: string | number | undefined) => void;
  setAllocationMethod: (method: 'static' | 'ai') => void;
  submitProjectForm: (e: React.FormEvent) => Promise<void>;
  deleteProject: () => Promise<void>;
  refreshProjects: () => Promise<void>;
}

export const useProjectManagement = (): UseProjectManagementReturn => {
  const { showSuccess, showError, showWarning, showConfirm } = useNotification();
  
  // Core project state
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Project modal state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  
  // Project form state
  const [projectForm, setProjectForm] = useState<ProjectFormData>({
    project_name: '',
    client_name: '',
    brief_description: '',
    physical_parameters: '',
    financial_parameters: 0 as number | undefined,
    timeline_deadline: '',
    event_date: ''
  });
  const [allocationMethod, setAllocationMethod] = useState<'static' | 'ai'>('static');

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load projects from database
  const loadProjects = useCallback(async () => {
    try {
      const projectsData = await ProducerService.loadProjects();
      setProjects(projectsData);
      
      // Auto-select first project if none selected
      if (projectsData.length > 0 && !currentProject) {
        setCurrentProject(projectsData[0]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      showError('Failed to load weddings');
    } finally {
      setIsLoading(false);
    }
  }, [currentProject, showError]);

  // Select a project
  const selectProject = useCallback((project: Project | null) => {
    setCurrentProject(project);
  }, []);

  // Open create project modal
  const openCreateProject = useCallback(() => {
    setIsEditingProject(false);
    setProjectForm({
      project_name: '',
      client_name: '',
      brief_description: '',
      physical_parameters: '',
      financial_parameters: undefined,
      timeline_deadline: '',
      event_date: ''
    });
    setAllocationMethod('static');
    setShowProjectModal(true);
  }, []);

  // Open edit project modal
  const openEditProject = useCallback(() => {
    if (!currentProject) return;
    setIsEditingProject(true);
    setProjectForm({
      project_name: currentProject.project_name || '',
      client_name: currentProject.client_name || '',
      brief_description: currentProject.brief_description || '',
      physical_parameters: currentProject.physical_parameters || '',
      financial_parameters: currentProject.financial_parameters,
      timeline_deadline: currentProject.timeline_deadline || '',
      event_date: currentProject.event_date || ''
    });
    setAllocationMethod('static');
    setShowProjectModal(true);
  }, [currentProject]);

  // Close project modal
  const closeProjectModal = useCallback(() => {
    setShowProjectModal(false);
    setIsEditingProject(false);
    setIsSubmittingProject(false);
  }, []);

  // Update project form field
  const updateProjectForm = useCallback((field: keyof ProjectFormData, value: string | number | undefined) => {
    setProjectForm(prev => ({
      ...prev,
      [field]: field === 'financial_parameters' ? (value === '' ? undefined : Number(value)) : value
    }));
  }, []);

  // Set allocation method
  const setAllocationMethodHandler = useCallback((method: 'static' | 'ai') => {
    setAllocationMethod(method);
  }, []);

  // Submit project form (create or update)
  const submitProjectForm = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProject(true);
    
    try {
      if (isEditingProject && currentProject) {
        // Update existing project
        await ProducerService.updateProject(currentProject.id, projectForm);
        await loadProjects();
        showSuccess('Wedding updated successfully');
      } else {
        // Create new project
        const createdProject = await ProducerService.createProject(projectForm);
        
        // Process brief if provided
        if (projectForm.brief_description) {
          try {
            const briefResult = await RailwayApiService.processBrief(
              createdProject.id, 
              projectForm.brief_description,
              {
                allocationMethod: 'ai', // Hardcode to AI allocation for new projects
                projectContext: {
                  financial_parameters: projectForm.financial_parameters,
                  timeline_deadline: projectForm.timeline_deadline,
                  physical_parameters: projectForm.physical_parameters
                }
              }
            );
            
            if (!briefResult.success) {
              console.warn('Brief processing failed:', briefResult.error?.message);
              showWarning(`Wedding created successfully, but brief processing failed: ${briefResult.error?.message}. You can manually add services later.`);
            } else {
              console.log('Brief processed successfully:', briefResult.data?.createdAssets.length, 'services created');
              showSuccess(`Wedding created successfully! ${briefResult.data?.createdAssets.length} services were automatically matched using smart matching.`, { duration: 6000 });
            }
          } catch (briefError) {
            console.error('Brief processing error:', briefError);
            showWarning('Wedding created successfully, but brief processing failed. You can manually add services later.');
          }
        } else {
          showSuccess('Wedding created successfully');
        }
        
        // Refresh projects and select the new one
        await loadProjects();
        const updatedProject = await ProducerService.loadProject(createdProject.id);
        if (updatedProject) {
          setCurrentProject(updatedProject);
        } else {
          setCurrentProject(createdProject);
        }
      }
      
      closeProjectModal();
    } catch (err) {
      console.error('Failed to submit project form', err);
      showError('Failed to save wedding');
    } finally {
      setIsSubmittingProject(false);
    }
  }, [isEditingProject, currentProject, projectForm, allocationMethod, loadProjects, showSuccess, showWarning, showError, closeProjectModal]);

  // Delete project
  const deleteProject = useCallback(async () => {
    if (!currentProject) return;
    
    const confirmDelete = await showConfirm({
      title: 'Delete Project',
      message: 'Delete this project and all related assets/quotes? This cannot be undone.',
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    
    if (!confirmDelete) return;
    
    try {
      await ProducerService.deleteProject(currentProject.id);
      await loadProjects();
      setCurrentProject(null);
      showSuccess('Wedding deleted successfully');
    } catch (err) {
      console.error('Failed to delete project', err);
      showError('Failed to delete wedding');
    }
  }, [currentProject, loadProjects, showConfirm, showSuccess, showError]);

  // Refresh projects list
  const refreshProjects = useCallback(async () => {
    await loadProjects();
  }, [loadProjects]);

  return {
    // State
    projects,
    currentProject,
    isLoading,
    showProjectModal,
    isEditingProject,
    isSubmittingProject,
    projectForm,
    allocationMethod,
    
    // Actions
    loadProjects,
    selectProject,
    openCreateProject,
    openEditProject,
    closeProjectModal,
    updateProjectForm,
    setAllocationMethod: setAllocationMethodHandler,
    submitProjectForm,
    deleteProject,
    refreshProjects
  };
};
