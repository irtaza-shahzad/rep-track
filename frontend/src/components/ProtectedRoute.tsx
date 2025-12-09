import { Navigate } from 'react-router-dom';
import { authStorage } from '@/infrastructure/storage/LocalStorageAdapter';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected Route Component
 * Checks if user is authenticated before rendering children
 * Redirects to landing page if not authenticated
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = authStorage.isAuthenticated();

  if (!isAuthenticated) {
    // Redirect to landing page if not authenticated
    return <Navigate to="/" replace />;
  }

  // Render the protected page if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
