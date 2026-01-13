import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Users, BookOpen, Palette, ShoppingBag, DollarSign, TrendingUp, 
  AlertCircle, Activity, BarChart3, Package 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStories: 0,
    totalArtworks: 0,
    totalProducts: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    newUsersToday: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchRecentActivities();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total users
      const usersSnap = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnap.size;

      // Get total stories
      const storiesSnap = await getDocs(collection(db, 'stories'));
      const totalStories = storiesSnap.size;

      // Get total artworks
      const artworksSnap = await getDocs(collection(db, 'artworks'));
      const totalArtworks = artworksSnap.size;

      // Get total products
      const productsSnap = await getDocs(collection(db, 'products'));
      const totalProducts = productsSnap.size;

      // Get total transactions
      const transactionsSnap = await getDocs(collection(db, 'transactions'));
      const totalTransactions = transactionsSnap.size;

      // Calculate total revenue
      let totalRevenue = 0;
      transactionsSnap.forEach(doc => {
        const data = doc.data();
        if (data.type === 'purchase' && data.amount) {
          totalRevenue += data.amount;
        }
      });

      // Get new users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let newUsersToday = 0;
      usersSnap.forEach(doc => {
        const data = doc.data();
        if (data.createdAt && data.createdAt.toDate() >= today) {
          newUsersToday++;
        }
      });

      setStats({
        totalUsers,
        totalStories,
        totalArtworks,
        totalProducts,
        totalTransactions,
        totalRevenue,
        newUsersToday,
        activeUsers: Math.floor(totalUsers * 0.3) // Mock: 30% active
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const activities = [];

      // Get recent transactions
      const transactionsQuery = query(
        collection(db, 'transactions'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const transactionsSnap = await getDocs(transactionsQuery);
      transactionsSnap.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'transaction',
          message: `ธุรกรรม ${data.type} จำนวน ${data.amount} credits`,
          time: data.createdAt?.toDate() || new Date(),
          icon: DollarSign,
          color: 'text-green-500'
        });
      });

      // Get recent stories
      const storiesQuery = query(
        collection(db, 'stories'),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      const storiesSnap = await getDocs(storiesQuery);
      storiesSnap.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'story',
          message: `นิยายใหม่: ${data.title}`,
          time: data.createdAt?.toDate() || new Date(),
          icon: BookOpen,
          color: 'text-blue-500'
        });
      });

      // Sort by time
      activities.sort((a, b) => b.time - a.time);
      setRecentActivities(activities.slice(0, 10));
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const StatCard = ({ icon: Icon, title, value, change, color }) => (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 hover:border-purple-500/50 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-500/10`}>
          <Icon className={`w-6 h-6 text-${color}-500`} />
        </div>
        {change && (
          <div className="flex items-center gap-1 text-green-500 text-sm">
            <TrendingUp size={16} />
            <span>+{change}%</span>
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-white mb-1">{value.toLocaleString()}</h3>
      <p className="text-gray-400 text-sm">{title}</p>
    </div>
  );

  const QuickAction = ({ to, icon: Icon, title, description, color }) => (
    <Link
      to={to}
      className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 hover:border-purple-500/50 transition-all hover:scale-105"
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg bg-${color}-500/10`}>
          <Icon className={`w-5 h-5 text-${color}-500`} />
        </div>
        <div>
          <h4 className="font-semibold text-white mb-1">{title}</h4>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">ภาพรวมและสถิติของระบบ</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            title="ผู้ใช้ทั้งหมด"
            value={stats.totalUsers}
            change={12}
            color="purple"
          />
          <StatCard
            icon={BookOpen}
            title="นิยายทั้งหมด"
            value={stats.totalStories}
            change={8}
            color="blue"
          />
          <StatCard
            icon={Palette}
            title="ผลงานศิลปะ"
            value={stats.totalArtworks}
            change={15}
            color="pink"
          />
          <StatCard
            icon={DollarSign}
            title="รายได้ทั้งหมด"
            value={stats.totalRevenue}
            change={20}
            color="green"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-400">ผู้ใช้ใหม่วันนี้</p>
                <p className="text-xl font-bold text-white">{stats.newUsersToday}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-400">ผู้ใช้ที่ Active</p>
                <p className="text-xl font-bold text-white">{stats.activeUsers}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-400">สินค้าทั้งหมด</p>
                <p className="text-xl font-bold text-white">{stats.totalProducts}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-cyan-500" />
              <div>
                <p className="text-sm text-gray-400">ธุรกรรมทั้งหมด</p>
                <p className="text-xl font-bold text-white">{stats.totalTransactions}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <QuickAction
                to="/admin/users"
                icon={Users}
                title="จัดการผู้ใช้"
                description="ดู แก้ไข และจัดการผู้ใช้ทั้งหมด"
                color="purple"
              />
              <QuickAction
                to="/admin/content"
                icon={BookOpen}
                title="จัดการเนื้อหา"
                description="จัดการนิยาย ตอน และผลงาน"
                color="blue"
              />
              <QuickAction
                to="/admin/transactions"
                icon={DollarSign}
                title="ธุรกรรม"
                description="ดูและจัดการธุรกรรมทั้งหมด"
                color="green"
              />
              <QuickAction
                to="/admin/reports"
                icon={AlertCircle}
                title="รายงาน"
                description="ตรวจสอบรายงานจากผู้ใช้"
                color="red"
              />
            </div>
          </div>

          {/* Recent Activities */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">กิจกรรมล่าสุด</h2>
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-[#2a2a2a] last:border-0 last:pb-0">
                      <activity.icon className={`w-5 h-5 ${activity.color} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.time.toLocaleString('th-TH')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">ไม่มีกิจกรรมล่าสุด</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
