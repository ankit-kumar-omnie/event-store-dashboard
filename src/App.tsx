import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import AuthLayout from './components/AuthLayout';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EventStreams from './pages/EventStreams';
import EntityDetails from './pages/EntityDetails';
import EventTimeline from './pages/EventTimeline';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import TimeTravel from './pages/TimeTravel';
// Temporarily disabled - Event Replay and State Comparison have React Query issues
// import EventReplay from './pages/EventReplay';
// import StateComparison from './pages/StateComparison';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={
              <AuthLayout>
                <Login />
              </AuthLayout>
            } />
            <Route path="/register" element={
              <AuthLayout>
                <Register />
              </AuthLayout>
            } />

            {/* Protected routes */}
            <Route path="/*" element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/streams" element={<EventStreams />} />
                    <Route path="/entity/:entityId" element={<EntityDetails />} />
                    <Route path="/timeline" element={<EventTimeline />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/time-travel" element={<TimeTravel />} />
                    {/* Temporarily disabled - React Query issues */}
                    {/* <Route path="/event-replay" element={<EventReplay />} /> */}
                    {/* <Route path="/state-comparison" element={<StateComparison />} /> */}
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            } />
          </Routes>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;