import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import type { Role } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, role, isInitialized } = useAuth();
  const location = useLocation();

  if (!isInitialized) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // Admin trying to access user area — redirect to admin
    if (role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    // User trying to access admin area — redirect to app
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, role, isInitialized } = useAuth();

  if (!isInitialized) {
    return <LoadingScreen message="Loading..." />;
  }

  if (user) {
    if (role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
