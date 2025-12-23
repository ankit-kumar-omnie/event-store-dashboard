import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import {
  Play,
  Download,
  RefreshCw,
  Calendar,
  Tag,
  Database,
  Layers,
  Clock,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { usersApi, eventSourcingApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EditableJsonViewer from '../components/EditableJsonViewer';

const EventReplay = () => {
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [filters, setFilters] = useState({
    fromDate: subDays(new Date(), 30).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    eventTypes: [] as string[],
    batchSize: 50,
  });
  const [availableEventTypes, setAvailableEventTypes] = useState<string[]>([]);
  const [replayTriggered, setReplayTriggered] = useState(false);

  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAllUsers,
  });

  const { data: replayResult, isLoading: replayLoading, error: replayError } = useQuery({
    queryKey: ['event-replay', selectedEntityId, filters, replayTriggered],
    queryFn: async () => {
      console.log('Replaying events for:', selectedEntityId, filters);
      const options: any = {};
      
      if (filters.fromDate) {
        options.fromDate = filters.fromDate;
      }
      if (filters.toDate) {
        options.toDate = filters.toDate;
      }
      if (filters.eventTypes.length > 0) {
        options.eventTypes = filters.eventTypes.join(',');
      }
      if (filters.batchSize) {
        options.batchSize = filters.batchSize;
      }
      
      return eventSourcingApi.replayEvents(selectedEntityId, options);
    },
    enabled: !!selectedEntityId && replayTriggered,
    retry: 1, // Only retry once
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache results
  });

  // Debug logging (after variable declarations)
  console.log('Users data:', users);
  console.log('Users loading:', usersLoading);
  console.log('Users error:', usersError);
  console.log('Auth token:', localStorage.getItem('authToken') ? 'Present' : 'Missing');
  console.log('Selected entity ID:', selectedEntityId);
  console.log('Replay triggered:', replayTriggered);
  console.log('Replay loading:', replayLoading);
  console.log('Button should be enabled:', !!selectedEntityId && !replayLoading);

  const { data: statistics } = useQuery({
    queryKey: ['statistics', selectedEntityId],
    queryFn: () => selectedEntityId ? eventSourcingApi.getEventStatistics(selectedEntityId) : null,
    enabled: !!selectedEntityId,
  });

  // Update available event types when statistics change
  useEffect(() => {
    if (statistics?.eventsByType) {
      setAvailableEventTypes(Object.keys(statistics.eventsByType));
    }
  }, [statistics]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setReplayTriggered(false); // Reset replay trigger when filters change
  };

  const handleEventTypeToggle = (eventType: string) => {
    setFilters(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(eventType)
        ? prev.eventTypes.filter(type => type !== eventType)
        : [...prev.eventTypes, eventType]
    }));
    setReplayTriggered(false);
  };

  const handleReplayEvents = () => {
    console.log('Triggering replay with:', { selectedEntityId, filters });
    setReplayTriggered(true);
  };

  const resetReplay = () => {
    setReplayTriggered(false);
    setTimeout(() => {
      console.log('Reset replay state');
    }, 100);
  };

  const exportReplayData = () => {
    if (replayResult) {
      const dataStr = JSON.stringify(replayResult, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `event-replay-${selectedEntityId}-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Event Replay</h1>
          <p className="mt-2 text-sm text-gray-700">
            Replay events with advanced filtering and analysis capabilities
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={exportReplayData}
            disabled={!replayResult}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Entity Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center">
                  <Database className="h-4 w-4 mr-1" />
                  Select Entity
                  {usersLoading && <span className="text-blue-500 ml-2">(Loading...)</span>}
                  {usersError && <span className="text-red-500 ml-2">(Error loading users)</span>}
                </span>
              </label>
              <select
                value={selectedEntityId}
                onChange={(e) => {
                  setSelectedEntityId(e.target.value);
                  setReplayTriggered(false);
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={usersLoading}
              >
                <option value="">
                  {usersLoading ? 'Loading users...' : 
                   usersError ? 'Error loading users' : 
                   'Choose an entity...'}
                </option>
                {users && Array.isArray(users) && users.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
                {/* Fallback test option if no users are loaded */}
                {(!users || users.length === 0) && !usersLoading && (
                  <option value="test-user-123">Test User (for debugging)</option>
                )}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Date Range
                </span>
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange('toDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Event Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center">
                  <Tag className="h-4 w-4 mr-1" />
                  Event Types
                </span>
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                {availableEventTypes.length > 0 ? (
                  availableEventTypes.map(eventType => (
                    <label key={eventType} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={filters.eventTypes.includes(eventType)}
                        onChange={() => handleEventTypeToggle(eventType)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{eventType}</span>
                    </label>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">Select an entity first</div>
                )}
              </div>
            </div>

            {/* Batch Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center">
                  <Layers className="h-4 w-4 mr-1" />
                  Batch Size
                </span>
              </label>
              <select
                value={filters.batchSize}
                onChange={(e) => handleFilterChange('batchSize', parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleReplayEvents}
                disabled={!selectedEntityId || replayLoading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {replayLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {replayLoading ? 'Replaying...' : 'Replay Events'}
              </button>
              
              {(replayTriggered || replayError) && (
                <button
                  onClick={resetReplay}
                  className="flex items-center px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Reset
                </button>
              )}
              
              {/* Debug info */}
              <div className="text-xs text-gray-500">
                Entity: {selectedEntityId || 'None'} | Users: {users?.length || 0} | Auth: {localStorage.getItem('authToken') ? '✓' : '✗'}
              </div>
            </div>

            {replayResult && (
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  {replayResult.totalEvents} events
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {replayResult.lastEventAt ? format(new Date(replayResult.lastEventAt), 'MMM d, yyyy') : 'N/A'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {replayError && (
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Replay Failed</h3>
              <p className="text-sm text-red-700 mt-1">
                {(replayError as any)?.message || 'An error occurred while replaying events'}
              </p>
              {(replayError as any)?.response?.status && (
                <p className="text-xs text-red-600 mt-1">
                  Status: {(replayError as any).response.status} - {(replayError as any).response.statusText}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {selectedEntityId && replayTriggered && (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Current State */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reconstructed State
              </h3>
              
              {replayLoading ? (
                <LoadingSpinner />
              ) : replayResult?.currentState ? (
                <EditableJsonViewer
                  data={replayResult.currentState}
                  title="Current State"
                  readOnly={false}
                  maxHeight="400px"
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {replayError ? 'Failed to load state' : 'No state data available'}
                </div>
              )}
            </div>
          </div>

          {/* Event History */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Filtered Event History ({replayResult?.eventHistory?.length || 0} events)
              </h3>
              
              {replayLoading ? (
                <LoadingSpinner />
              ) : replayResult?.eventHistory && replayResult.eventHistory.length > 0 ? (
                <div className="max-h-96 overflow-auto">
                  <div className="space-y-3">
                    {replayResult.eventHistory.map((event: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-md">
                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {event.eventName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(event.createdAt), 'MMM d, HH:mm:ss')}
                          </span>
                        </div>
                        <div className="p-3">
                          <EditableJsonViewer
                            data={event.payload}
                            title={`Event ${index + 1} Payload`}
                            readOnly={false}
                            maxHeight="200px"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {replayError ? 'Failed to load events' : 'No events match the current filters'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Summary */}
      {statistics && (
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Entity Statistics</h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-900">Total Events</p>
                    <p className="text-2xl font-bold text-blue-600">{statistics.totalEvents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Tag className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-900">Event Types</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Object.keys(statistics.eventsByType).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-yellow-900">First Event</p>
                    <p className="text-sm font-bold text-yellow-600">
                      {statistics.firstEventAt 
                        ? format(new Date(statistics.firstEventAt), 'MMM d, yyyy')
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <RefreshCw className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-900">Avg Time</p>
                    <p className="text-sm font-bold text-purple-600">
                      {statistics.averageTimeBetweenEvents 
                        ? `${Math.round(statistics.averageTimeBetweenEvents / 1000)}s`
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Type Breakdown */}
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Event Type Distribution</h4>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(statistics.eventsByType).map(([eventType, count]) => (
                  <div key={eventType} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                    <span className="text-sm text-gray-700">{eventType}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default EventReplay;