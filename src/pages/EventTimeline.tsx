import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import {
  Calendar,
  Clock,
  Search,
  Activity,
  User,
  GitBranch,
} from 'lucide-react';
import { usersApi, eventSourcingApi } from '../services/api';

interface UserType {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface EventData {
  eventName: string;
  timestamp: string;
  changes: string[];
}

interface TimelineData {
  userId: string;
  userInfo?: UserType;
  events: EventData[];
}

interface EventWithUser extends EventData {
  userId: string;
  userInfo?: UserType;
}

const EventTimeline: React.FC = () => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 7).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users } = useQuery<UserType[]>({
    queryKey: ['users'],
    queryFn: usersApi.getAllUsers,
  });

  const { data: timelineData } = useQuery<TimelineData[]>({
    queryKey: ['timeline-data', selectedUsers, dateRange],
    queryFn: async () => {
      if (selectedUsers.length === 0) return [];
      
      const promises = selectedUsers.map(async (userId: string) => {
        const timeline = await eventSourcingApi.getEventTimeline(userId);
        const userInfo = users?.find((u: UserType) => u.id === userId);
        return {
          userId,
          userInfo,
          events: timeline.events.filter((event: EventData) => {
            const eventDate = new Date(event.timestamp);
            const startDate = new Date(dateRange.start);
            const endDate = new Date(dateRange.end);
            return eventDate >= startDate && eventDate <= endDate;
          }),
        };
      });
      
      return Promise.all(promises);
    },
    enabled: selectedUsers.length > 0,
  });

  // Flatten and sort all events by timestamp
  const allEvents: EventWithUser[] = timelineData?.flatMap((userData: TimelineData) => 
    userData.events.map((event: EventData) => ({
      ...event,
      userId: userData.userId,
      userInfo: userData.userInfo,
    }))
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) || [];

  // Filter events
  const filteredEvents = allEvents.filter((event: EventWithUser) => {
    const matchesEventType = eventTypeFilter === 'all' || event.eventName === eventTypeFilter;
    const matchesSearch = searchTerm === '' || 
      event.changes.some((change: string) => change.toLowerCase().includes(searchTerm.toLowerCase())) ||
      event.userInfo?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.userInfo?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesEventType && matchesSearch;
  });

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const eventTypes = [...new Set(allEvents.map((event: EventWithUser) => event.eventName))];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Event Timeline</h1>
          <p className="mt-2 text-sm text-gray-700">
            Chronological view of all events across selected entities
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Event Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Events</option>
                {eventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            {/* Results Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Results
              </label>
              <div className="flex items-center space-x-2 py-2">
                <Activity className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {filteredEvents.length} events
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* User Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Users</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users?.map((user: UserType) => (
                  <label key={user.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'superAdmin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Timeline</h3>
              
              {selectedUsers.length === 0 ? (
                <div className="text-center py-12">
                  <User className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No users selected</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select one or more users to view their event timeline.
                  </p>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No events match your current filters.
                  </p>
                </div>
              ) : (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {filteredEvents.map((event: EventWithUser, eventIdx: number) => (
                      <li key={`${event.userId}-${event.timestamp}-${eventIdx}`}>
                        <div className="relative pb-8">
                          {eventIdx !== filteredEvents.length - 1 ? (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                event.eventName === 'user-created' ? 'bg-blue-500' :
                                event.eventName === 'user-updated' ? 'bg-yellow-500' :
                                'bg-gray-500'
                              }`}>
                                {event.eventName === 'user-created' ? (
                                  <User className="h-4 w-4 text-white" />
                                ) : event.eventName === 'user-updated' ? (
                                  <GitBranch className="h-4 w-4 text-white" />
                                ) : (
                                  <Activity className="h-4 w-4 text-white" />
                                )}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {event.userInfo?.name}
                                  </p>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    event.eventName === 'user-created' ? 'bg-blue-100 text-blue-800' :
                                    event.eventName === 'user-updated' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {event.eventName}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  {event.changes.map((change: string, changeIdx: number) => (
                                    <p key={changeIdx} className="text-sm text-gray-600">
                                      {change}
                                    </p>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{format(new Date(event.timestamp), 'MMM d')}</span>
                                </div>
                                <div className="mt-1">
                                  {format(new Date(event.timestamp), 'HH:mm:ss')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventTimeline;