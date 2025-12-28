import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  BookOpen, 
  Palette, 
  TrendingUp, 
  Shield,
  Trash2,
  Eye,
  AlertCircle,
  DollarSign
} from 'lucide-react';

const AdminDashboard = ({ currentLanguage }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStories: 0,
    totalArtworks: 0,
    totalViews: 0
  });
  const [users, setUsers] = useState([]);
  const [stories, setStories] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const isThaiLanguage = currentLanguage === 'th';

  useEffect(() => {
    // Check if user is admin
    if (!currentUser || userProfile?.role !== 'admin') {
      navigate('/');
      return;
    }
    
    fetchDashboardData();
  }, [currentUser, userProfile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);

      // Fetch stories
      const storiesSnapshot = await getDocs(collection(db, 'stories'));
      const storiesData = storiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStories(storiesData);

      // Fetch artworks
      const artworksSnapshot = await getDocs(collection(db, 'artworks'));
      const artworksData = artworksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setArtworks(artworksData);

      // Calculate stats
      const totalViews = [...storiesData, ...artworksData].reduce((sum, item) => sum + (item.views || 0), 0);
      
      setStats({
        totalUsers: usersData.length,
        totalStories: storiesData.length,
        totalArtworks: artworksData.length,
        totalViews
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm(isThaiLanguage ? 'คุณแน่ใจหรือไม่ที่จะลบเรื่องนี้?' : 'Are you sure you want to delete this story?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'stories', storyId));
      setStories(stories.filter(s => s.id !== storyId));
      setStats(prev => ({ ...prev, totalStories: prev.totalStories - 1 }));
    } catch (error) {
      console.error('Error deleting story:', error);
    }
  };

  const handleDeleteArtwork = async (artworkId) => {
    if (!window.confirm(isThaiLanguage ? 'คุณแน่ใจหรือไม่ที่จะลบผลงานนี้?' : 'Are you sure you want to delete this artwork?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'artworks', artworkId));
      setArtworks(artworks.filter(a => a.id !== artworkId));
      setStats(prev => ({ ...prev, totalArtworks: prev.totalArtworks - 1 }));
    } catch (error) {
      console.error('Error deleting artwork:', error);
    }
  };

  const handleToggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  if (!currentUser || userProfile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            {isThaiLanguage ? 'ไม่มีสิทธิ์เข้าถึง' : 'Access Denied'}
          </h2>
          <p className="text-gray-400 mb-4">
            {isThaiLanguage 
              ? 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้'
              : 'You do not have permission to access this page'
            }
          </p>
          <Button onClick={() => navigate('/')}>
            {isThaiLanguage ? 'กลับหน้าแรก' : 'Go Home'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
            <Shield className="w-10 h-10 mr-3 text-purple-600" />
            {isThaiLanguage ? 'แดชบอร์ดผู้ดูแลระบบ' : 'Admin Dashboard'}
          </h1>
          <p className="text-gray-400">
            {isThaiLanguage 
              ? 'จัดการผู้ใช้และเนื้อหาทั้งหมดในระบบ'
              : 'Manage all users and content in the system'
            }
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-[#2a2a2a]">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-white hover:border-[#2a2a2a]'
              }`}
            >
              {isThaiLanguage ? 'ภาพรวม' : 'Overview'}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-white hover:border-[#2a2a2a]'
              }`}
            >
              {isThaiLanguage ? 'ผู้ใช้' : 'Users'}
            </button>
            <button
              onClick={() => setActiveTab('stories')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stories'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-white hover:border-[#2a2a2a]'
              }`}
            >
              {isThaiLanguage ? 'นิยาย' : 'Stories'}
            </button>
            <button
              onClick={() => setActiveTab('artworks')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'artworks'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-white hover:border-[#2a2a2a]'
              }`}
            >
              {isThaiLanguage ? 'งานศิลปะ' : 'Artworks'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#1a1a1a] rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="w-10 h-10 text-blue-600" />
                    <span className="text-3xl font-bold text-white">{stats.totalUsers}</span>
                  </div>
                  <h3 className="text-gray-400 font-medium">
                    {isThaiLanguage ? 'ผู้ใช้ทั้งหมด' : 'Total Users'}
                  </h3>
                </div>

                <div className="bg-[#1a1a1a] rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <BookOpen className="w-10 h-10 text-teal-600" />
                    <span className="text-3xl font-bold text-white">{stats.totalStories}</span>
                  </div>
                  <h3 className="text-gray-400 font-medium">
                    {isThaiLanguage ? 'นิยายทั้งหมด' : 'Total Stories'}
                  </h3>
                </div>

                <div className="bg-[#1a1a1a] rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Palette className="w-10 h-10 text-purple-600" />
                    <span className="text-3xl font-bold text-white">{stats.totalArtworks}</span>
                  </div>
                  <h3 className="text-gray-400 font-medium">
                    {isThaiLanguage ? 'งานศิลปะทั้งหมด' : 'Total Artworks'}
                  </h3>
                </div>

                <div className="bg-[#1a1a1a] rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="w-10 h-10 text-pink-600" />
                    <span className="text-3xl font-bold text-white">{stats.totalViews}</span>
                  </div>
                  <h3 className="text-gray-400 font-medium">
                    {isThaiLanguage ? 'ยอดดูทั้งหมด' : 'Total Views'}
                  </h3>
                </div>

                {/* Withdrawal Management Card */}
                <div 
                  onClick={() => navigate('/admin/withdrawals')}
                  className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/20 rounded-lg shadow-sm p-6 cursor-pointer hover:border-green-500/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <DollarSign className="w-10 h-10 text-green-500" />
                    <span className="text-lg font-semibold text-green-400">
                      {isThaiLanguage ? 'จัดการ' : 'Manage'}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold mb-1">
                    {isThaiLanguage ? 'คำขอถอนเงิน' : 'Withdrawal Requests'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {isThaiLanguage ? 'อนุมัติและจัดการคำขอถอนเงิน' : 'Approve and manage withdrawal requests'}
                  </p>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-[#1a1a1a] rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#0f0f0f]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {isThaiLanguage ? 'ผู้ใช้' : 'User'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {isThaiLanguage ? 'อีเมล' : 'Email'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {isThaiLanguage ? 'บทบาท' : 'Role'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {isThaiLanguage ? 'การจัดการ' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#1a1a1a] divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{user.displayName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-gray-100 text-white'
                          }`}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleUserRole(user.id, user.role)}
                          >
                            {user.role === 'admin' 
                              ? (isThaiLanguage ? 'ลดสิทธิ์' : 'Demote') 
                              : (isThaiLanguage ? 'เลื่อนขั้น' : 'Promote')
                            }
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Stories Tab */}
            {activeTab === 'stories' && (
              <div className="bg-[#1a1a1a] rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#0f0f0f]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {isThaiLanguage ? 'ชื่อเรื่อง' : 'Title'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {isThaiLanguage ? 'ผู้เขียน' : 'Author'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {isThaiLanguage ? 'ยอดดู' : 'Views'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {isThaiLanguage ? 'การจัดการ' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#1a1a1a] divide-y divide-gray-200">
                    {stories.map((story) => (
                      <tr key={story.id}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-white">{story.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{story.authorName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {story.views || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteStory(story.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            {isThaiLanguage ? 'ลบ' : 'Delete'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Artworks Tab */}
            {activeTab === 'artworks' && (
              <div className="bg-[#1a1a1a] rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#0f0f0f]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {isThaiLanguage ? 'ชื่อผลงาน' : 'Title'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {isThaiLanguage ? 'ศิลปิน' : 'Artist'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {isThaiLanguage ? 'ยอดดู' : 'Views'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {isThaiLanguage ? 'การจัดการ' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#1a1a1a] divide-y divide-gray-200">
                    {artworks.map((artwork) => (
                      <tr key={artwork.id}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-white">{artwork.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{artwork.artistName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {artwork.views || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteArtwork(artwork.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            {isThaiLanguage ? 'ลบ' : 'Delete'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

