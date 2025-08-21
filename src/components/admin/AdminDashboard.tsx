import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Project, Asset, Supplier, Quote } from '../../lib/supabase';
import { 
  BarChart3, 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp,
  Activity,
  Database,
  Settings
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalAssets: 0,
    totalSuppliers: 0,
    totalQuotes: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingQuotes: 0,
    acceptedQuotes: 0
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load all data for statistics
      const [projectsRes, assetsRes, suppliersRes, quotesRes] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('assets').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('quotes').select('*')
      ]);

      const projects = projectsRes.data || [];
      const assets = assetsRes.data || [];
      const suppliers = suppliersRes.data || [];
      const quotes = quotesRes.data || [];

      // Calculate statistics
      setStats({
        totalProjects: projects.length,
        totalAssets: assets.length,
        totalSuppliers: suppliers.length,
        totalQuotes: quotes.length,
        activeProjects: projects.filter(p => p.project_status === 'In Progress' || p.project_status === 'Quoting').length,
        completedProjects: projects.filter(p => p.project_status === 'Completed').length,
        pendingQuotes: quotes.filter(q => q.status === 'Submitted').length,
        acceptedQuotes: quotes.filter(q => q.status === 'Accepted').length
      });

      // Get recent projects
      setRecentProjects(projects.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
      case 'Quoting':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">System overview and platform analytics</p>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <Settings className="h-5 w-5" />
          <span className="text-sm">System Administration</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold">Total Projects</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.totalProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-teal-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold">Suppliers</h3>
              <p className="text-2xl font-bold text-teal-600">{stats.totalSuppliers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold">Total Assets</h3>
              <p className="text-2xl font-bold text-purple-600">{stats.totalAssets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold">Total Quotes</h3>
              <p className="text-2xl font-bold text-green-600">{stats.totalQuotes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="h-6 w-6 text-gray-700" />
            <h2 className="text-xl font-semibold">Project Status Overview</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="font-medium text-yellow-800">Active Projects</span>
              <span className="text-2xl font-bold text-yellow-600">{stats.activeProjects}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="font-medium text-green-800">Completed Projects</span>
              <span className="text-2xl font-bold text-green-600">{stats.completedProjects}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-6 w-6 text-gray-700" />
            <h2 className="text-xl font-semibold">Quote Activity</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="font-medium text-blue-800">Pending Quotes</span>
              <span className="text-2xl font-bold text-blue-600">{stats.pendingQuotes}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="font-medium text-green-800">Accepted Quotes</span>
              <span className="text-2xl font-bold text-green-600">{stats.acceptedQuotes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Database className="h-6 w-6 text-gray-700" />
          <h2 className="text-xl font-semibold">Recent Projects</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Project Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Client</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Budget</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentProjects.map((project) => (
                <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{project.project_name}</td>
                  <td className="py-3 px-4 text-gray-600">{project.client_name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.project_status)}`}>
                      {project.project_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    ${project.financial_parameters?.toFixed(2) || '0.00'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(project.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Platform:</span>
            <span className="ml-2 text-gray-600">ProdBay Production Management</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Version:</span>
            <span className="ml-2 text-gray-600">1.0.0 MVP</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Environment:</span>
            <span className="ml-2 text-gray-600">Development</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;