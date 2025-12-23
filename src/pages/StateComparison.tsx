import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import {
  GitCompare,
  Calendar,
  ArrowRight,
  Plus,
  Minus,
  Edit,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { usersApi, eventSourcingApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EditableJsonViewer from '../components/EditableJsonViewer';

const StateComparison = () => {
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [fromDate, setFromDate] = useState(subDays(new Date(), 7).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [comparisonTriggered, setComparisonTriggered] = useState(false);

  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAllUsers,
  });

  const { data: comparison, isLoading: comparisonLoading, error: comparisonError } = useQuery({
    queryKey: ['state-comparison', selectedEntityId, fromDate, toDate, comparisonTriggered],
    queryFn: async () => {
      console.log('Comparing states for:', selectedEntityId, fromDate, toDate);
      return eventSourcingApi.compareStates(selectedEntityId, fromDate, toDate);
    },
    enabled: !!selectedEntityId && !!fromDate && !!toDate && comparisonTriggered,
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
  console.log('Comparison triggered:', comparisonTriggered);
  console.log('Comparison loading:', comparisonLoading);
  console.log('Button should be enabled:', !!selectedEntityId && !!fromDate && !!toDate && !comparisonLoading);

  const handleCompareStates = () => {
    console.log('Triggering comparison with:', { selectedEntityId, fromDate, toDate });
    setComparisonTriggered(true);
  };

  const resetComparison = () => {
    setComparisonTriggered(false);
    setTimeout(() => {
      console.log('Reset comparison state');
    }, 100);
  };

  const exportComparison = () => {
    if (comparison) {
      const dataStr = JSON.stringify(comparison, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `state-comparison-${selectedEntityId}-${fromDate}-to-${toDate}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const getChangeIcon = (change: any) => {
    if (change.from === null) return <Plus className="h-4 w-4 text-green-600" />;
    if (change.to === null) return <Minus className="h-4 w-4 text-red-600" />;
    return <Edit className="h-4 w-4 text-blue-600" />;
  };

  const getChangeColor = (change: any) => {
    if (change.from === null) return 'bg-green-50 border-green-200';
    if (change.to === null) return 'bg-red-50 border-red-200';
    return 'bg-blue-50 border-blue-200';
  };

  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">State Comparison</h1>
          <p className="mt-2 text-sm text-gray-700">
            Compare entity states between two points in time to see what changed
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={exportComparison}
            disabled={!comparison}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Comparison
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Entity Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Entity
                {usersLoading && <span className="text-blue-500 ml-2">(Loading...)</span>}
                {usersError && <span className="text-red-500 ml-2">(Error loading users)</span>}
              </label>
              <select
                value={selectedEntityId}
                onChange={(e) => {
                  setSelectedEntityId(e.target.value);
                  setComparisonTriggered(false);
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

            {/* From Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  From Date
                </span>
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setComparisonTriggered(false);
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  To Date
                </span>
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setComparisonTriggered(false);
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Compare Button */}
            <div className="flex items-end">
              <button
                onClick={handleCompareStates}
                disabled={!selectedEntityId || !fromDate || !toDate || comparisonLoading}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
              >
                {comparisonLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <GitCompare className="h-4 w-4 mr-2" />
                )}
                {comparisonLoading ? 'Comparing...' : 'Compare States'}
              </button>
              
              {(comparisonTriggered || comparisonError) && (
                <button
                  onClick={resetComparison}
                  className="w-full flex items-center justify-center px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Reset
                </button>
              )}
              
              {/* Debug info */}
              <div className="text-xs text-gray-500 mt-2">
                Entity: {selectedEntityId || 'None'} | Users: {users?.length || 0} | Auth: {localStorage.getItem('authToken') ? '✓' : '✗'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {comparisonError && (
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Comparison Failed</h3>
              <p className="text-sm text-red-700 mt-1">
                {(comparisonError as any)?.message || 'An error occurred while comparing states'}
              </p>
              {(comparisonError as any)?.response?.status && (
                <p className="text-xs text-red-600 mt-1">
                  Status: {(comparisonError as any).response.status} - {(comparisonError as any).response.statusText}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {selectedEntityId && comparisonTriggered && (
        <div className="mt-8 space-y-8">
          {/* Summary */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Comparison Summary</h3>
              
              {comparisonLoading ? (
                <LoadingSpinner />
              ) : comparison ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Period</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(comparison.period.from), 'MMM d, yyyy')} →{' '}
                          {format(new Date(comparison.period.to), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Changes</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {comparison.stateComparison.changes.length}
                        </p>
                      </div>
                      <Edit className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-900">Events in Period</p>
                        <p className="text-2xl font-bold text-green-600">
                          {comparison.eventsInPeriod.length}
                        </p>
                      </div>
                      <Eye className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {comparisonError ? 'Failed to load comparison data' : 'Click "Compare States" to see results'}
                </div>
              )}
            </div>
          </div>

          {/* State Changes */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">State Changes</h3>
              
              {comparisonLoading ? (
                <LoadingSpinner />
              ) : comparison?.stateComparison.changes.length > 0 ? (
                <div className="space-y-4">
                  {comparison.stateComparison.changes.map((change: any, index: number) => (
                    <div key={index} className={`border rounded-lg p-4 ${getChangeColor(change)}`}>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getChangeIcon(change)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-sm font-medium text-gray-900">{change.field}</h4>
                            <span className="text-xs px-2 py-1 bg-white rounded-full border">
                              {change.from === null ? 'Added' : 
                               change.to === null ? 'Removed' : 'Modified'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Before</p>
                              <div className="bg-white rounded p-2 border">
                                {change.from === null ? (
                                  <span className="text-gray-400 italic">Not set</span>
                                ) : (
                                  <EditableJsonViewer
                                    data={change.from}
                                    title="Before Value"
                                    readOnly={false}
                                    maxHeight="150px"
                                  />
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">After</p>
                              <div className="bg-white rounded p-2 border">
                                {change.to === null ? (
                                  <span className="text-gray-400 italic">Removed</span>
                                ) : (
                                  <EditableJsonViewer
                                    data={change.to}
                                    title="After Value"
                                    readOnly={false}
                                    maxHeight="150px"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {comparisonError ? 'Failed to load changes' : 
                   comparison ? 'No changes detected between the selected dates' : 
                   'Click "Compare States" to see changes'}
                </div>
              )}
            </div>
          </div>

          {/* Before and After States */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Before State */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  State Before ({comparison ? format(new Date(comparison.period.from), 'MMM d, yyyy') : 'N/A'})
                </h3>
                
                {comparisonLoading ? (
                  <LoadingSpinner />
                ) : comparison?.stateComparison.before ? (
                  <EditableJsonViewer
                    data={comparison.stateComparison.before}
                    title="Before State"
                    readOnly={false}
                    maxHeight="400px"
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {comparisonError ? 'Failed to load state data' : 
                     comparison ? 'No state data available' : 
                     'Click "Compare States" to see before state'}
                  </div>
                )}
              </div>
            </div>

            {/* After State */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  State After ({comparison ? format(new Date(comparison.period.to), 'MMM d, yyyy') : 'N/A'})
                </h3>
                
                {comparisonLoading ? (
                  <LoadingSpinner />
                ) : comparison?.stateComparison.after ? (
                  <EditableJsonViewer
                    data={comparison.stateComparison.after}
                    title="After State"
                    readOnly={false}
                    maxHeight="400px"
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {comparisonError ? 'Failed to load state data' : 
                     comparison ? 'No state data available' : 
                     'Click "Compare States" to see after state'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Events in Period */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Events in Period ({comparison?.eventsInPeriod.length || 0})
              </h3>
              
              {comparisonLoading ? (
                <LoadingSpinner />
              ) : comparison?.eventsInPeriod.length > 0 ? (
                <div className="max-h-96 overflow-auto">
                  <div className="space-y-3">
                    {comparison.eventsInPeriod.map((event: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-md">
                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {event.action}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(event.timestamp), 'MMM d, HH:mm:ss')}
                          </span>
                        </div>
                        <div className="p-3">
                          <EditableJsonViewer
                            data={event.details}
                            title={`Event ${index + 1} Details`}
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
                  {comparisonError ? 'Failed to load events' : 
                   comparison ? 'No events occurred in the selected period' : 
                   'Click "Compare States" to see events'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default StateComparison;