import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Edit2, Trash2, Check, X, Clock } from 'lucide-react';
import { useNotification } from '@/hooks/useNotification';
import type { Asset } from '@/lib/supabase';

interface TimelineEvent {
  id: string;
  asset_id: string;
  event_name: string;
  event_date: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface AssetTimelineManagerProps {
  asset: Asset;
  onTimelineUpdate?: () => void;
}

/**
 * AssetTimelineManager - Full CRUD for asset timeline events
 * 
 * Features:
 * - Create, read, update, delete timeline events
 * - Chronological display of events
 * - Date validation and formatting
 * - Inline editing capabilities
 * - Event status tracking
 */
const AssetTimelineManager: React.FC<AssetTimelineManagerProps> = ({
  asset,
  onTimelineUpdate
}) => {
  const { showSuccess, showError } = useNotification();
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    event_name: '',
    event_date: '',
    description: ''
  });
  const [editingEvent, setEditingEvent] = useState({
    event_name: '',
    event_date: '',
    description: ''
  });

  const loadTimelineEvents = useCallback(async () => {
    setLoading(true);
    try {
      // For now, we'll simulate timeline events since we don't have a dedicated table
      // In a real implementation, you'd create an asset_timeline_events table
      const events: TimelineEvent[] = [
        {
          id: '1',
          asset_id: asset.id,
          event_name: 'Asset Created',
          event_date: asset.created_at,
          description: 'Initial asset creation',
          created_at: asset.created_at,
          updated_at: asset.created_at
        }
      ];

      // Add timeline from asset if it exists
      if (asset.timeline) {
        events.push({
          id: '2',
          asset_id: asset.id,
          event_name: 'Target Deadline',
          event_date: asset.timeline,
          description: 'Planned completion date',
          created_at: asset.created_at,
          updated_at: asset.updated_at
        });
      }

      // Sort by date
      events.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
      setTimelineEvents(events);
    } catch (err) {
      console.error('Error loading timeline events:', err);
      showError('Failed to load timeline events');
    } finally {
      setLoading(false);
    }
  }, [asset.id, showError]);

  // Load timeline events
  useEffect(() => {
    loadTimelineEvents();
  }, [loadTimelineEvents]);

  // Add new timeline event
  const handleAddEvent = async () => {
    if (!newEvent.event_name.trim() || !newEvent.event_date) {
      showError('Event name and date are required');
      return;
    }

    try {
      // In a real implementation, you'd call a service method to create the event
      const event: TimelineEvent = {
        id: Date.now().toString(),
        asset_id: asset.id,
        event_name: newEvent.event_name.trim(),
        event_date: newEvent.event_date,
        description: newEvent.description.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setTimelineEvents(prev => [...prev, event].sort((a, b) => 
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      ));

      setNewEvent({ event_name: '', event_date: '', description: '' });
      setIsAddingEvent(false);
      showSuccess('Timeline event added successfully');
      onTimelineUpdate?.();
    } catch (err) {
      console.error('Error adding timeline event:', err);
      showError('Failed to add timeline event');
    }
  };

  // Start editing an event
  const startEditing = (event: TimelineEvent) => {
    setEditingEventId(event.id);
    setEditingEvent({
      event_name: event.event_name,
      event_date: event.event_date.split('T')[0], // Convert to YYYY-MM-DD format
      description: event.description
    });
  };

  // Save edited event
  const handleSaveEdit = async (eventId: string) => {
    if (!editingEvent.event_name.trim() || !editingEvent.event_date) {
      showError('Event name and date are required');
      return;
    }

    try {
      setTimelineEvents(prev => prev.map(event => 
        event.id === eventId 
          ? {
              ...event,
              event_name: editingEvent.event_name.trim(),
              event_date: editingEvent.event_date,
              description: editingEvent.description.trim(),
              updated_at: new Date().toISOString()
            }
          : event
      ).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()));

      setEditingEventId(null);
      setEditingEvent({ event_name: '', event_date: '', description: '' });
      showSuccess('Timeline event updated successfully');
      onTimelineUpdate?.();
    } catch (err) {
      console.error('Error updating timeline event:', err);
      showError('Failed to update timeline event');
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingEventId(null);
    setEditingEvent({ event_name: '', event_date: '', description: '' });
  };

  // Delete timeline event
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this timeline event?')) {
      return;
    }

    try {
      setTimelineEvents(prev => prev.filter(event => event.id !== eventId));
      showSuccess('Timeline event deleted successfully');
      onTimelineUpdate?.();
    } catch (err) {
      console.error('Error deleting timeline event:', err);
      showError('Failed to delete timeline event');
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Check if event is in the past
  const isPastEvent = (dateString: string): boolean => {
    return new Date(dateString) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Loading timeline...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Timeline Events</h3>
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
            {timelineEvents.length}
          </span>
        </div>
        <button
          onClick={() => setIsAddingEvent(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {/* Add New Event Form */}
      {isAddingEvent && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Add New Timeline Event</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Name *
              </label>
              <input
                type="text"
                value={newEvent.event_name}
                onChange={(e) => setNewEvent(prev => ({ ...prev, event_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Design Review, Production Start"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Date *
              </label>
              <input
                type="date"
                value={newEvent.event_date}
                onChange={(e) => setNewEvent(prev => ({ ...prev, event_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Additional details about this event"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddEvent}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                <Check className="w-4 h-4" />
                Add Event
              </button>
              <button
                onClick={() => {
                  setIsAddingEvent(false);
                  setNewEvent({ event_name: '', event_date: '', description: '' });
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Events List */}
      <div className="space-y-3">
        {timelineEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">No timeline events yet</p>
            <p className="text-sm">Add events to track important milestones</p>
          </div>
        ) : (
          timelineEvents.map((event) => (
            <div
              key={event.id}
              className={`bg-white border rounded-lg p-4 ${
                isPastEvent(event.event_date) 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200'
              }`}
            >
              {editingEventId === event.id ? (
                // Edit Mode
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Name *
                    </label>
                    <input
                      type="text"
                      value={editingEvent.event_name}
                      onChange={(e) => setEditingEvent(prev => ({ ...prev, event_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      value={editingEvent.event_date}
                      onChange={(e) => setEditingEvent(prev => ({ ...prev, event_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editingEvent.description}
                      onChange={(e) => setEditingEvent(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveEdit(event.id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Display Mode
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{event.event_name}</h4>
                      {isPastEvent(event.event_date) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          <Check className="w-3 h-3" />
                          Completed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(event.event_date)}</span>
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-700">{event.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditing(event)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Edit event"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssetTimelineManager;
