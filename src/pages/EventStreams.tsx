import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Clock,
  Activity,
  ChevronLeft,
  ChevronRight,
  Layers,
  Database,
} from 'lucide-react';
import { format } from 'date-fns';
import JsonViewer from '../components/JsonViewer';
import LoadingSpinner from '../components/LoadingSpinner';
import { eventSourcingApi, usersApi } from '../services/api';

const EventStreams: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(1);
  const [batchSize, setBatchSize] = useState(25);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAllUsers,
  });

  const { data: streamBatch, isLoading: batchLoading, refetch: refetchBatch } = useQuery({
    queryKey: ['stream-batch', selectedEntityId, currentBatch, batchSize],
    queryFn: () => {
      if (!selectedEntityId) return null;
      return eventSourcingApi.getStreamBatch(selectedEntityId, currentBatch, batchSize);
    },
    enabled: !!selectedEntityId,
  });

  const { data: eventStats } = useQuery({
    queryKey: ['event-stats', selectedEntityId],
    queryFn: () => selectedEntityId ? eventSourcingApi.getEventStatistics(selectedEntityId) : null,
    enabled: !!selectedEntityId,
  });

  // Auto-refresh streaming
  React.useEffect(() => {
    if (!isStreaming || !selectedEntityId) return;

    const interval = setInterval(() => {
      refetchBatch();
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [isStreaming, selectedEntityId, refetchBatch]);

  const handleStartStreaming = () => {
    setIsStreaming(true);
  };

  const handleStopStreaming = () => {
    setIsStreaming(false);
  };

  const handleResetStream = () => {
    setCurrentBatch(1);
    refetchBatch();
  };

  const handlePreviousBatch = () => {
    if (currentBatch > 1) {
      setCurrentBatch(prev => prev - 1);
    }
  };

  const handleNextBatch = () => {
    if (streamBatch?.hasMore) {
      setCurrentBatch(prev => prev + 1);
    }
  };

  const handleBatchSizeChange = (newSize: number) => {
    setBatchSize(newSize);
    setCurrentBatch(1); // Reset to first batch when changing size
  };

  const filteredUsers = users?.filter((user: any) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredEvents = streamBatch?.batch?.filter((event: any) =>
    event.eventName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Event Streams</h1>
          <p className="mt-2 text-sm text-gray-700">
            Real-time event streaming with batch processing and advanced filtering
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Entity Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Entity</h3>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* User List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {usersLoading ? (
                  <LoadingSpinner text="Loading users..." className="py-8" />
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user: any) => (
                    <div
                      key={user.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedEntityId === user.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSelectedEntityId(user.id);
                        setCurrentBatch(1); // Reset to first batch
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'superAdmin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">No users found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stream Controls */}
          {selectedEntityId && (
            <div className="mt-6 bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Stream Controls</h3>
                
                {/* Batch Size Control */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Layers className="h-4 w-4 inline mr-1" />
                    Batch Size
                  </label>
                  <select
                    value={batchSize}
                    onChange={(e) => handleBatchSizeChange(parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>10 events</option>
                    <option value={25}>25 events</option>
                    <option value={50}>50 events</option>
                    <option value={100}>100 events</option>
                  </select>
                </div>

                {/* Stream Controls */}
                <div className="flex space-x-3 mb-4">
                  {!isStreaming ? (
                    <button
                      onClick={handleStartStreaming}
                      className="flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </button>
                  ) : (
                    <button
                      onClick={handleStopStreaming}
                      className="flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Stop
                    </button>
                  )}
                  <button
                    onClick={handleResetStream}
                    className="flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </button>
                </div>

                {/* Batch Navigation */}
                {streamBatch && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        Batch {currentBatch} ({streamBatch.totalProcessed} processed)
                      </span>
                      <div className="flex space-x-1">
                        <button
                          onClick={handlePreviousBatch}
                          disabled={currentBatch === 1}
                          className="p-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleNextBatch}
                          disabled={!streamBatch.hasMore}
                          className="p-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min((streamBatch.totalProcessed / (eventStats?.totalEvents || 1)) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Stream Stats */}
                {eventStats && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Events:</span>
                      <span className="font-medium">{eventStats.totalEvents}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">First Event:</span>
                      <span className="font-medium">
                        {eventStats.firstEventAt ? format(new Date(eventStats.firstEventAt), 'MMM d, HH:mm') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last Event:</span>
                      <span className="font-medium">
                        {eventStats.lastEventAt ? format(new Date(eventStats.lastEventAt), 'MMM d, HH:mm') : 'N/A'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Event Stream Display */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Event Stream {streamBatch && `(Batch ${currentBatch})`}
                </h3>
                <div className="flex items-center space-x-2">
                  {isStreaming && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-500">Live</span>
                    </div>
                  )}
                  <Link
                    to={selectedEntityId ? `/entity/${selectedEntityId}` : '#'}
                    className={`flex items-center px-3 py-1 text-sm font-medium rounded-md ${
                      selectedEntityId
                        ? 'text-primary-600 hover:text-primary-500'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Link>
                </div>
              </div>

              {!selectedEntityId ? (
                <div className="text-center py-12">
                  <Activity className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No entity selected</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select an entity from the list to view its event stream.
                  </p>
                </div>
              ) : batchLoading ? (
                <LoadingSpinner text="Loading events..." className="py-12" />
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((event: any, index: number) => (
                      <div
                        key={`${event.eventName}-${event.createdAt}-${index}`}
                        className={`border rounded-lg p-4 ${isStreaming ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              event.eventName === 'user-created-event' ? 'bg-blue-100 text-blue-800' :
                              event.eventName === 'user-updated-event' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {event.eventName}
                            </span>
                            {isStreaming && (
                              <span className="text-xs text-green-600 font-medium">LIVE</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>{format(new Date(event.createdAt), 'MMM d, HH:mm:ss')}</span>
                          </div>
                        </div>
                        
                        {/* Show payload preview */}
                        <div className="text-sm text-gray-700 mb-2">
                          {event.payload?.name && <div>Name: {event.payload.name}</div>}
                          {event.payload?.email && <div>Email: {event.payload.email}</div>}
                          {event.payload?.role && <div>Role: {event.payload.role}</div>}
                        </div>

                        <div className="mt-3">
                          <button
                            onClick={() => setExpandedEvent(
                              expandedEvent === `${index}` ? null : `${index}`
                            )}
                            className="text-xs text-primary-600 hover:text-primary-500"
                          >
                            {expandedEvent === `${index}` ? 'Hide' : 'Show'} full payload
                          </button>
                          {expandedEvent === `${index}` && (
                            <div className="mt-2 bg-gray-50 p-3 rounded border border-gray-200">
                              <JsonViewer data={event.payload} collapsed={false} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Database className="mx-auto h-8 w-8 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No events in this batch</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Try navigating to a different batch or check if events exist for this entity.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventStreams;