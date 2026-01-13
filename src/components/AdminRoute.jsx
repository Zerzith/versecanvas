import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminRoute({ children }) {
  const { currentUser, userProfile } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (userProfile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
          <a href="/" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
            กลับหน้าแรก
          </a>
        </div>
      </div>
    );
  }

  return children;
}
