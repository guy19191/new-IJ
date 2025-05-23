import { useEventStore } from '../store/eventStore';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const user = useEventStore((state) => state.user);
  if (!user?.can_host) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute; 