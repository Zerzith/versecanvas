import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCredit } from '../contexts/CreditContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageCircle, 
  DollarSign, 
  Users, 
  BookOpen, 
  Palette, 
  ShoppingBag,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CreatorDashboard() {
  const { currentUser } = useAuth();
  const { credits } = useCredit();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalFollowers: 0,
    totalEarnings: 0,
    storiesCount: 0,
    artworksCount: 0,
    productsCount: 0
  });
  const [recentContent, setRecentContent] = useState({
    stories: [],
    artworks: [],
    products: []
  });
  const [topContent, setTopContent] = useState({
    stories: [],
    artworks: [],
    products: []
  });

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // โหลดนิยาย
      const storiesQuery = query(
        collection(db, 'stories'),
        where('authorId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const storiesSnapshot = await getDocs(storiesQuery);
      const stories = storiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // โหลดผลงานศิลปะ
      const artworksQuery = query(
        collection(db, 'artworks'),
        where('artistId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const artworksSnapshot = await getDocs(artworksQuery);
      const artworks = artworksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // โหลดสินค้า
      const productsQuery = query(
        collection(db, 'products'),
        where('sellerId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const productsSnapshot = await getDocs(productsQuery);
      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // คำนวณสถิติ
      const totalViews = [...stories, ...artworks, ...products].reduce((sum, item) => sum + (item.views || 0), 0);
      const totalLikes = [...stories, ...artworks, ...products].reduce((sum, item) => sum + (item.likes || 0), 0);
      const totalComments = [...stories, ...artworks].reduce((sum, item) => sum + (item.comments || 0), 0);

      // โหลดผู้ติดตาม
      const followersQuery = query(
        collection(db, 'follows'),
        where('followingId', '==', currentUser.uid)
      );
      const followersSnapshot = await getDocs(followersQuery);

      // โหลดรายได้
      const earningsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', currentUser.uid),
        where('type', '==', 'credit')
      );
      const earningsSnapshot = await getDocs(earningsQuery);
      const totalEarnings = earningsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

      setStats({
        totalViews,
        totalLikes,
        totalComments,
        totalFollowers: followersSnapshot.size,
        totalEarnings,
        storiesCount: stories.length,
        artworksCount: artworks.length,
        productsCount: products.length
      });

      setRecentContent({
        stories: stories.slice(0, 5),
        artworks: artworks.slice(0, 5),
        products: products.slice(0, 5)
      });

      // Top content (เรียงตาม views)
      setTopContent({
        stories: [...stories].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5),
        artworks: [...artworks].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5),
        products: [...products].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5)
      });

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, change, color }) => (
    <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] hover:border-purple-500 transition">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change > 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
          <p className="text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-24 pb-12">
      <div className="max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <TrendingUp size={36} />
            แดชบอร์ดผู้สร้าง
          </h1>
          <p className="text-gray-400">ภาพรวมผลงานและสถิติของคุณ</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Eye}
            label="การเข้าชมทั้งหมด"
            value={stats.totalViews}
            change={15}
            color="from-blue-500 to-cyan-500"
          />
          <StatCard
            icon={Heart}
            label="ถูกใจทั้งหมด"
            value={stats.totalLikes}
            change={8}
            color="from-pink-500 to-rose-500"
          />
          <StatCard
            icon={Users}
            label="ผู้ติดตาม"
            value={stats.totalFollowers}
            change={12}
            color="from-purple-500 to-indigo-500"
          />
          <StatCard
            icon={DollarSign}
            label="รายได้ (เครดิต)"
            value={credits || 0}
            change={23}
            color="from-yellow-500 to-orange-500"
          />
        </div>

        {/* Content Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/stories"
            className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] hover:border-blue-500 transition group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <BookOpen size={24} className="text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">นิยาย</p>
                <p className="text-3xl font-bold">{stats.storiesCount}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 group-hover:text-blue-400 transition">
              ดูทั้งหมด →
            </p>
          </Link>

          <Link
            to="/artworks"
            className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] hover:border-pink-500 transition group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500">
                <Palette size={24} className="text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">ผลงานศิลปะ</p>
                <p className="text-3xl font-bold">{stats.artworksCount}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 group-hover:text-pink-400 transition">
              ดูทั้งหมด →
            </p>
          </Link>

          <Link
            to="/shop"
            className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] hover:border-green-500 transition group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                <ShoppingBag size={24} className="text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">สินค้า</p>
                <p className="text-3xl font-bold">{stats.productsCount}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 group-hover:text-green-400 transition">
              ดูทั้งหมด →
            </p>
          </Link>
        </div>

        {/* Top Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Stories */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="text-blue-400" />
              นิยายยอดนิยม
            </h2>
            <div className="space-y-3">
              {topContent.stories.length > 0 ? (
                topContent.stories.map((story, index) => (
                  <Link
                    key={story.id}
                    to={`/story/${story.id}`}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#2a2a2a] transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{story.title}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Eye size={14} /> {story.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={14} /> {story.likes || 0}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-gray-400 text-center py-8">ยังไม่มีนิยาย</p>
              )}
            </div>
          </div>

          {/* Top Artworks */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Palette className="text-pink-400" />
              ผลงานยอดนิยม
            </h2>
            <div className="space-y-3">
              {topContent.artworks.length > 0 ? (
                topContent.artworks.map((artwork, index) => (
                  <div
                    key={artwork.id}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#2a2a2a] transition cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{artwork.title}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Eye size={14} /> {artwork.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={14} /> {artwork.likes || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-8">ยังไม่มีผลงาน</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
