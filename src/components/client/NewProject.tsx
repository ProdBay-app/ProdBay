import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '@/lib/supabase';
import { RailwayApiService } from '@/services/railwayApiService';
import { useNotification } from '@/hooks/useNotification';
import { FileText, Calendar, DollarSign, MapPin, Send, Brain, Sparkles } from 'lucide-react';

const NewProject: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showWarning, showError } = useNotification();
  const [formData, setFormData] = useState({
    project_name: '',
    client_name: '',
    brief_description: '',
    physical_parameters: '',
    financial_parameters: 0,
    timeline_deadline: ''
  });
  const [allocationMethod, setAllocationMethod] = useState<'static' | 'ai'>('static');
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
      const supabase = await getSupabase();
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
        String(project.id), 
        formData.brief_description,
        {
          allocationMethod: allocationMethod,
          projectContext: {
            financial_parameters: formData.financial_parameters,
            timeline_deadline: formData.timeline_deadline,
            physical_parameters: formData.physical_parameters
          }
        }
      );

      if (!briefResult.success) {
        console.warn('Brief processing failed:', briefResult.error?.message);
        // Show a warning but continue - project was created successfully
        showWarning(`Wedding created successfully, but brief processing failed: ${briefResult.error?.message}. You can manually create services later.`);
      } else {
        console.log('Brief processed successfully:', briefResult.data?.createdAssets.length, 'assets created');
        // Show success message with AI info if applicable
        const aiInfo = briefResult.data?.aiData 
          ? ` using AI (${Math.round(briefResult.data.aiData.confidence * 100)}% confidence)`
          : '';
        showSuccess(`Wedding created successfully! ${briefResult.data?.createdAssets.length} services were automatically generated from your brief${aiInfo}.`, { duration: 8000 });
      }

      setSubmitStatus('success');
      
      // Navigate to client dashboard
      navigate(`/client/dashboard?project=${project.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      setSubmitStatus('error');
      showError('Failed to create wedding. Please try again.');
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
            <h1 className="text-3xl font-bold text-gray-900">Create New Wedding</h1>
            <p className="text-gray-600 mt-1">Submit your wedding brief to get started</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="project_name" className="block text-sm font-medium text-gray-700 mb-2">
                Wedding Name *
              </label>
              <input
                type="text"
                id="project_name"
                name="project_name"
                value={formData.project_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter wedding name"
              />
            </div>

            <div>
              <label htmlFor="client_name" className="block text-sm font-medium text-gray-700 mb-2">
                Couple Name *
              </label>
              <input
                type="text"
                id="client_name"
                name="client_name"
                value={formData.client_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter couple name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="brief_description" className="block text-sm font-medium text-gray-700 mb-2">
              Wedding Brief & Description *
            </label>
            <textarea
              id="brief_description"
              name="brief_description"
              value={formData.brief_description}
              onChange={handleInputChange}
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your wedding in detail. Include requirements for venue, catering, photography, floral, music, or other services..."
            />
          </div>

          {/* AI Allocation Toggle */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Brain className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Smart Service Allocation</h3>
              <Sparkles className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-gray-600 mb-4">
              Enable smart analysis to automatically identify services and suggest detailed specifications from your brief.
            </p>
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Service Allocation Method:</p>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="allocationMethod"
                    value="static"
                    checked={allocationMethod === 'static'}
                    onChange={(e) => setAllocationMethod(e.target.value as 'static' | 'ai')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Static Allocation</span>
                    <p className="text-xs text-gray-500">Rule-based service identification using keyword matching</p>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="allocationMethod"
                    value="ai"
                    checked={allocationMethod === 'ai'}
                    onChange={(e) => setAllocationMethod(e.target.value as 'static' | 'ai')}
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500 focus:ring-2"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Smart Allocation</span>
                    <p className="text-xs text-gray-500">Automatically analyzes your brief to identify services with detailed specifications</p>
                  </div>
                </label>
              </div>
              
              {allocationMethod === 'ai' && (
                <div className="mt-3 p-3 bg-purple-100 rounded-lg">
                  <p className="text-sm text-purple-800">
                    ✨ The system will analyze your brief to identify services, create detailed specifications, 
                    and suggest optimal vendor allocations with confidence scores.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="physical_parameters" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4" />
                <span>Venue Details</span>
              </label>
              <input
                type="text"
                id="physical_parameters"
                name="physical_parameters"
                value={formData.physical_parameters}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Venue, size, capacity, etc."
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
                {submitStatus === 'creating-project' && 'Creating Wedding...'}
                {submitStatus === 'processing-brief' && 'Processing Brief...'}
                {submitStatus === 'success' && 'Wedding Created!'}
                {submitStatus === 'error' && 'Failed - Try Again'}
                {submitStatus === 'idle' && 'Create Wedding'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProject;