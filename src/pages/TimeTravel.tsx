import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Clock,
  RotateCcw,
  FastForward,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  History,
  Zap,
} from 'lucide-react';
import { usersApi, eventSourcingApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import JsonViewer from '../components/JsonViewer';

const TimeTravel: React.FC = () => {
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [selectedTimestamp, setSelectedTimestamp] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [eventCount, setEventCount] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'timestamp' | 'eventCount'>('timestamp');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // ms

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAllUsers,
  });

  const { data: stateAtTime, isLoading: stateLoading } = useQuery({
    queryKey: ['state-at-time', selectedEntityId, selectedTimestamp, eventCount, viewMode],
    queryFn: () => {
      if (!selectedEntityId) return null;
      
      if (viewMode === 'timestamp') {
        return eventSourcingApi.getStateAtTime(selectedEntityId, selectedTimestamp);
      } else {
        return eventSourcingApi.getStateAfterEvents(selectedEntityId, eventCount);
      }
    },
    enabled: !!selectedEntityId,
  });

  const { data: timeline } = useQuery({
    queryKey: ['timeline', selectedEntityId],
    queryFn: () => selectedEntityId ? eventSourcingApi.getEventTimeline(selectedEntityId) : null,
    enabled: !!selectedEntityId,
  });

  // Auto-play functionality
  React.useEffect(() => {
    if (!isPlaying || !timeline?.events || viewMode !== 'eventCount') return;

    const interval = setInterval(() => {
      setEventCount(prev => {
        const maxEvents = timeline.events.length;
        return prev >= maxEvents ? 1 : prev + 1;
      });
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, timeline, playbackSpeed, viewMode]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStepForward = () => {
    if (timeline?.events) {
      setEventCount(prev => Math.min(prev + 1, timeline.events.length));
    }
  };

  const handleStepBackward = () => {
    setEventCount(prev => Math.max(prev - 1, 1));
  };

  const handleJumpToStart = () => {
    setEventCount(1);
    setIsPlaying(false);
  };

  const handleJumpToEnd = () => {
    if (timeline?.events) {
      setEventCount(timeline.events.length);
      setIsPlaying(false);
    }
  };

  const handleTimestampChange = (eventIndex: number) => {
    if (timeline?.events && timeline.events[eventIndex]) {
      setSelectedTimestamp(timeline.events[eventIndex].timestamp.slice(0, 16));
      setEventCount(eventIndex + 1);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Time Travel</h1>
          <p className="mt-2 text-sm text-gray-700">
            Travel through time to see how entities evolved with each event
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Entity Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Entity
              </label>
              <select
                value={selectedEntityId}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose an entity...</option>
                {users?.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Travel Mode
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="timestamp"
                    checked={viewMode === 'timestamp'}
                    onChange={(e) => setViewMode(e.target.value as 'timestamp')}
                    className="mr-2"
                  />
                  <Clock className="h-4 w-4 mr-1" />
                  By Time
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="eventCount"
                    checked={viewMode === 'eventCount'}
                    onChange={(e) => setViewMode(e.target.value as 'eventCount')}
                    className="mr-2"
                  />
                  <Zap className="h-4 w-4 mr-1" />
                  By Events
                </label>
              </div>
            </div>

            {/* Time/Event Controls */}
            <div>
              {viewMode === 'timestamp' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Timestamp
                  </label>
                  <input
                    type="datetime-local"
                    value={selectedTimestamp}
                    onChange={(e) => setSelectedTimestamp(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Count: {eventCount} / {timeline?.totalEvents || 0}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max={timeline?.totalEvents || 1}
                    value={eventCount}
                    onChange={(e) => setEventCount(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Playback Controls */}
          {viewMode === 'eventCount' && selectedEntityId && (
            <div className="mt-6 flex items-center justify-center space-x-4">
              <button
                onClick={handleJumpToStart}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                title="Jump to Start"
              >
                <SkipBack className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleStepBackward}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                title="Step Backward"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              
              <button
                onClick={handlePlayPause}
                className={`p-3 rounded-full ${
                  isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                } text-white`}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </button>
              
              <button
                onClick={handleStepForward}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                title="Step Forward"
              >
                <FastForward className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleJumpToEnd}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                title="Jump to End"
              >
                <SkipForward className="h-5 w-5" />
              </button>

              <div className="ml-8 flex items-center space-x-2">
                <label className="text-sm text-gray-600">Speed:</label>
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseInt(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={2000}>0.5x</option>
                  <option value={1000}>1x</option>
                  <option value={500}>2x</option>
                  <option value={250}>4x</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedEntityId && (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Current State */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    State at {viewMode === 'timestamp' ? 'Time' : `Event ${eventCount}`}
                  </h3>
                  {stateAtTime && (
                    <div className="text-sm text-gray-500">
                      {stateAtTime.totalEvents} events processed
                    </div>
                  )}
                </div>
                
                {stateLoading ? (
                  <LoadingSpinner />
                ) : stateAtTime?.currentState ? (
                  <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-auto">
                    <JsonViewer data={stateAtTime.currentState} />
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No state data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Navigation */}
          <div>
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Event Timeline</h3>
                
                {timeline?.events ? (
                  <div className="max-h-96 overflow-auto">
                    <div className="space-y-2">
                      {timeline.events.map((event, index) => (
                        <button
                          key={index}
                          onClick={() => handleTimestampChange(index)}
                          className={`w-full text-left p-3 rounded-md border transition-colors ${
                            (viewMode === 'eventCount' && index + 1 === eventCount) ||
                            (viewMode === 'timestamp' && event.timestamp.slice(0, 16) === selectedTimestamp)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              #{index + 1} {event.eventName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(event.timestamp), 'MMM d, HH:mm')}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {event.changes.slice(0, 2).map((change, changeIdx) => (
                              <div key={changeIdx}>{change}</div>
                            ))}
                            {event.changes.length > 2 && (
                              <div className="text-gray-400">
                                +{event.changes.length - 2} more changes
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    No events found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTravel;