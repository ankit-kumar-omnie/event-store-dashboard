import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Activity,
  Database,
  Users,
  Clock,
  GitBranch,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { healthApi, usersApi } from '../services/api';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: healthApi.getHealth,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 1,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAllUsers,
    retry: 1,
  });

  // Removed userEventSourcingApi.getUserActivitySummary since user-event-sourcing controller was removed
  // const { data: userActivity } = useQuery({
  //   queryKey: ['user-activity'],
  //   queryFn: userEventSourcingApi.getUserActivitySummary,
  //   retry: 1,
  // });

  // Mock data for dashboard stats since user activity endpoint is not available
  const userActivity = {
    activity: {
      totalEvents: 0,
      recentActivity: [],
    }
  };

  const stats = [
    {
      name: 'Total Users',
      value: users?.length || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive',
    },
    {
      name: 'Total Events',
      value: userActivity?.activity?.totalEvents || 0,
      icon: Activity,
      color: 'bg-green-500',
      change: '+5.4%',
      changeType: 'positive',
    },
    {
      name: 'Active Streams',
      value: '3',
      icon: Database,
      color: 'bg-purple-500',
      change: '+2.1%',
      changeType: 'positive',
    },
    {
      name: 'System Uptime',
      value: health?.uptime ? `${Math.round(health.uptime / 3600)}h` : 'N/A',
      icon: Clock,
      color: 'bg-yellow-500',
      change: health?.status === 'ok' ? '+99.9%' : 'N/A',
      changeType: health?.status === 'ok' ? 'positive' : 'neutral',
    },
  ];

  const recentEvents = [
    {
      id: 1,
      type: 'user-created',
      description: 'New user registered',
      timestamp: new Date().toISOString(),
      severity: 'info',
    },
    {
      id: 2,
      type: 'user-updated',
      description: 'User profile updated',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      severity: 'info',
    },
    {
      id: 3,
      type: 'system',
      description: 'Event stream reconnected',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      severity: 'warning',
    },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Event Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Monitor and analyze your event streams in real-time
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} p-3 rounded-md`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-600' : 
                        stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Events */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Events</h3>
              <Link
                to="/streams"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                    event.severity === 'info' ? 'bg-blue-400' :
                    event.severity === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {event.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(event.timestamp), 'MMM d, yyyy HH:mm:ss')}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      event.severity === 'info' ? 'bg-blue-100 text-blue-800' :
                      event.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {event.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/streams"
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Database className="h-8 w-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">View Streams</span>
              </Link>
              <Link
                to="/timeline"
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <GitBranch className="h-8 w-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Event Timeline</span>
              </Link>
              <Link
                to="/analytics"
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <BarChart3 className="h-8 w-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Analytics</span>
              </Link>
              <div className="flex flex-col items-center p-4 border border-gray-200 rounded-lg opacity-50">
                <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-500">Alerts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${health?.status === 'ok' ? 'bg-green-100' : 'bg-yellow-100'} rounded-full flex items-center justify-center`}>
                    <div className={`w-3 h-3 ${health?.status === 'ok' ? 'bg-green-500' : 'bg-yellow-500'} rounded-full`}></div>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">API Server</p>
                  <p className="text-sm text-gray-500">{health?.status === 'ok' ? 'Operational' : 'Unknown'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Database</p>
                  <p className="text-sm text-gray-500">Connected</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Event Store</p>
                  <p className="text-sm text-gray-500">Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;