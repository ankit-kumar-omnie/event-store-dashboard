import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Activity, Clock, BarChart3, Eye } from 'lucide-react';
import { eventSourcingApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import JsonViewer from '../components/JsonViewer';

const EntityDetails: React.FC = () => {
  const { entityId } = useParams<{ entityId: string }>();

  const { data: currentState, isLoading: stateLoading } = useQuery({
    queryKey: ['entity-state', entityId],
    queryFn: () => entityId ? eventSourcingApi.replayEvents(entityId) : null,
    enabled: !!entityId,
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['entity-timeline', entityId],
    queryFn: () => entityId ? eventSourcingApi.getEventTimeline(entityId) : null,
    enabled: !!entityId,
  });

  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['entity-statistics', entityId],
    queryFn: () => entityId ? eventSourcingApi.getEventStatistics(entityId) : null,
    enabled: !!entityId,
  });

  if (!entityId) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Entity ID not provided</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please provide a valid entity ID to view details.
          </p>
          <Link
            to="/streams"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Streams
          </Link>
        </div>
      </div>
    );
  }

  const isLoading = stateLoading || timelineLoading || statsLoading;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <div className="flex items-center space-x-3">
            <Link
              to="/streams"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Streams
            </Link>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">Entity Details</h1>
          <p className="mt-2 text-sm text-gray-700">
            Detailed view of entity: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{entityId}</code>
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Activity className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Events
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {statistics?.totalEvents || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Event Types
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {Object.keys(statistics?.eventsByType || {}).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        First Event
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {statistics?.firstEventAt 
                          ? new Date(statistics.firstEventAt).toLocaleDateString()
                          : 'N/A'
                        }
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Eye className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Last Event
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {statistics?.lastEventAt 
                          ? new Date(statistics.lastEventAt).toLocaleDateString()
                          : 'N/A'
                        }
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current State and Timeline */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Current State */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current State</h3>
                {currentState?.currentState ? (
                  <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-auto">
                    <JsonViewer data={currentState.currentState} />
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No state data available
                  </div>
                )}
              </div>
            </div>

            {/* Recent Events Timeline */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Events</h3>
                {timeline?.events && timeline.events.length > 0 ? (
                  <div className="max-h-96 overflow-auto">
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {timeline.events.slice(-10).reverse().map((event, eventIdx) => (
                          <li key={eventIdx}>
                            <div className="relative pb-8">
                              {eventIdx !== timeline.events.slice(-10).length - 1 ? (
                                <span
                                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                  aria-hidden="true"
                                />
                              ) : null}
                              <div className="relative flex space-x-3">
                                <div>
                                  <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                    <Activity className="h-4 w-4 text-white" />
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {event.eventName}
                                    </p>
                                    <div className="mt-1 space-y-1">
                                      {event.changes.map((change, changeIdx) => (
                                        <p key={changeIdx} className="text-sm text-gray-600">
                                          {change}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                    <time dateTime={event.timestamp}>
                                      {new Date(event.timestamp).toLocaleString()}
                                    </time>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No events found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Event Types Breakdown */}
          {statistics?.eventsByType && Object.keys(statistics.eventsByType).length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Event Types Breakdown</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(statistics.eventsByType).map(([eventType, count]) => (
                    <div key={eventType} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{eventType}</p>
                          <p className="text-xs text-gray-500">Event Type</p>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{count}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EntityDetails;