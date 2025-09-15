import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { RailwayApiService } from '../../services/railwayApiService';
import { FileText, Calendar, DollarSign, MapPin, Send } from 'lucide-react';

const NewProject: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    project_name: '',
    client_name: '',
    brief_description: '',
    physical_parameters: '',
    financial_parameters: 0,
    timeline_deadline: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'creating-project' | 'processing-brief' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'financial_parameters' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('creating-project');

    try {
      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert(formData)
        .select()
        .single();

      if (projectError || !project) {
        throw new Error('Failed to create project');
      }

      // Process brief using Railway API
      setSubmitStatus('processing-brief');
      const briefResult = await RailwayApiService.processBrief(
        project.id, 
        formData.brief_description
      );

      if (!briefResult.success) {
        console.warn('Brief processing failed:', briefResult.error?.message);
        // Show a warning but continue - project was created successfully
        alert(`Project created successfully, but brief processing failed: ${briefResult.error?.message}. You can manually create assets later.`);
      } else {
        console.log('Brief processed successfully:', briefResult.data?.createdAssets.length, 'assets created');
        // Show success message
        alert(`Project created successfully! ${briefResult.data?.createdAssets.length} assets were automatically generated from your brief.`);
      }

      setSubmitStatus('success');
      
      // Navigate to client dashboard
      navigate(`/client/dashboard?project=${project.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      setSubmitStatus('error');
      alert('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-8">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
            <p className="text-gray-600 mt-1">Submit your project brief to get started</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="project_name" className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                id="project_name"
                name="project_name"
                value={formData.project_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter project name"
              />
            </div>

            <div>
              <label htmlFor="client_name" className="block text-sm font-medium text-gray-700 mb-2">
                Client Name *
              </label>
              <input
                type="text"
                id="client_name"
                name="client_name"
                value={formData.client_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter client name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="brief_description" className="block text-sm font-medium text-gray-700 mb-2">
              Project Brief & Description *
            </label>
            <textarea
              id="brief_description"
              name="brief_description"
              value={formData.brief_description}
              onChange={handleInputChange}
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your event or project in detail. Include requirements for printing, staging, audio, lighting, catering, transport, or design services..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="physical_parameters" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4" />
                <span>Physical Parameters</span>
              </label>
              <input
                type="text"
                id="physical_parameters"
                name="physical_parameters"
                value={formData.physical_parameters}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Location, size, capacity, etc."
              />
            </div>

            <div>
              <label htmlFor="financial_parameters" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4" />
                <span>Budget</span>
              </label>
              <input
                type="number"
                id="financial_parameters"
                name="financial_parameters"
                value={formData.financial_parameters || ''}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="timeline_deadline" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4" />
                <span>Deadline</span>
              </label>
              <input
                type="date"
                id="timeline_deadline"
                name="timeline_deadline"
                value={formData.timeline_deadline}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
              <span>
                {submitStatus === 'creating-project' && 'Creating Project...'}
                {submitStatus === 'processing-brief' && 'Processing Brief...'}
                {submitStatus === 'success' && 'Project Created!'}
                {submitStatus === 'error' && 'Failed - Try Again'}
                {submitStatus === 'idle' && 'Create Project'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProject;