import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthCallback from './pages/AuthCallback';
import Home from './pages/Home';
import Profile from './pages/Profile';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const EventDashboard = lazy(() => import('./pages/EventDashboard'));
const GuestView = lazy(() => import('./pages/GuestView'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <AnimatePresence mode="wait">
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateEvent />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/event/:id" 
              element={
                <ProtectedRoute>
                  <EventDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/guest/:id" element={<GuestView />} />
            <Route 
              path="/me" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            {/* Auth callbacks */}
            <Route path="/auth/spotify/callback" element={<AuthCallback />} />
            <Route path="/auth/youtube/callback" element={<AuthCallback />} />
            <Route path="/auth/apple/callback" element={<AuthCallback />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </AnimatePresence>
  );
}

export default App;