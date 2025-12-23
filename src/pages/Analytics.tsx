import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { subDays, format, eachDayOfInterval } from 'date-fns';
import {
  TrendingUp,
  Users,
  Activity,
  BarChart3,
  Calendar,
  Download,
} from 'lucide-react';
import { usersApi, eventSourcingApi } from '../services/api';

interface User {
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

interface UserAnalyticsData {
  userId: string;
  userName: string;
  userRole: string;
  stats: {
    totalEvents: number;
    eventsByType: Record<string, number>;
  };
  eventsInRange: EventData[];
}

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: usersApi.getAllUsers,
  });

  const { data: analyticsData } = useQuery<UserAnalyticsData[] | null>({
    queryKey: ['analytics-data', dateRange],
    queryFn: async () => {
      if (!users) return null;

      const promises = users.map(async (user: User) => {
        try {
          const stats = await eventSourcingApi.getEventStatistics(user.id);
          const timeline = await eventSourcingApi.getEventTimeline(user.id);
          
          // Filter events by date range
          const filteredEvents = timeline.events.filter((event: EventData) => {
            const eventDate = new Date(event.timestamp);
            const startDate = new Date(dateRange.start);
            const endDate = new Date(dateRange.end);
            return eventDate >= startDate && eventDate <= endDate;
          });

          return {
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            stats,
            eventsInRange: filteredEvents,
          };
        } catch (error) {
          return {
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            stats: { totalEvents: 0, eventsByType: {} },
            eventsInRange: [],
          };
        }
      });

      return Promise.all(promises);
    },
    enabled: !!users,
  });

  // Process data for charts
  const processedData = React.useMemo(() => {
    if (!analyticsData) return null;

    // Events by user
    const eventsByUser = analyticsData.map(userData => ({
      name: userData.userName,
      events: userData.eventsInRange.length,
      role: userData.userRole,
    }));

    // Events by type
    const eventsByType: Record<string, number> = {};
    analyticsData.forEach((userData: UserAnalyticsData) => {
      userData.eventsInRange.forEach((event: EventData) => {
        eventsByType[event.eventName] = (eventsByType[event.eventName] || 0) + 1;
      });
    });

    const eventTypeData = Object.entries(eventsByType).map(([type, count]) => ({
      name: type,
      value: count,
    }));

    // Events over time
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });

    const eventsOverTime = dateInterval.map(date => {
      const dayEvents = analyticsData.reduce((count: number, userData: UserAnalyticsData) => {
        const dayEventCount = userData.eventsInRange.filter((event: EventData) => {
          const eventDate = new Date(event.timestamp);
          return format(eventDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        }).length;
        return count + dayEventCount;
      }, 0);

      return {
        date: format(date, 'MMM dd'),
        events: dayEvents,
      };
    });

    // User activity summary
    const userActivitySummary = analyticsData.map((userData: UserAnalyticsData) => ({
      name: userData.userName,
      role: userData.userRole,
      totalEvents: userData.stats.totalEvents,
      recentEvents: userData.eventsInRange.length,
      lastActivity: userData.eventsInRange.length > 0 
        ? userData.eventsInRange[0].timestamp 
        : null,
    }));

    return {
      eventsByUser,
      eventTypeData,
      eventsOverTime,
      userActivitySummary,
    };
  }, [analyticsData, dateRange]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const totalEvents = processedData?.eventsByUser.reduce((sum, user) => sum + user.events, 0) || 0;
  const activeUsers = processedData?.userActivitySummary.filter(user => user.recentEvents > 0).length || 0;
  const totalUsers = users?.length || 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-2 text-sm text-gray-700">
            Analyze event patterns and user activity across your system
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="mt-8 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">Date Range:</label>
            </div>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                    {totalEvents}
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
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Users
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {activeUsers}
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
                <TrendingUp className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg Events/User
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {totalUsers > 0 ? Math.round(totalEvents / totalUsers) : 0}
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
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Event Types
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {processedData?.eventTypeData.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Events Over Time */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Events Over Time</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processedData?.eventsOverTime || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="events" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Events by User */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Events by User</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedData?.eventsByUser || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="events" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Event Types Distribution */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Event Types Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processedData?.eventTypeData || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {processedData?.eventTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* User Activity Summary */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Activity Summary</h3>
            <div className="overflow-hidden">
              <div className="max-h-80 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recent Events
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Events
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processedData?.userActivitySummary.map((user, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'superAdmin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.recentEvents}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.totalEvents}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;