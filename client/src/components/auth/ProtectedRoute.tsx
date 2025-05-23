import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../../utils/auth';
import LoadingSpinner from '../ui/LoadingSpinner';
import { Suspense } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireHost?: boolean;
}

export default function ProtectedRoute({ children, requireHost = false }: ProtectedRouteProps) {
  const location = useLocation();
  const authenticated = isAuthenticated();

  if (!authenticated) {
    // Redirect to login but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireHost) {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    if (!userData.isHost) {
      return <Navigate to="/" replace />;
    }
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  );
} 