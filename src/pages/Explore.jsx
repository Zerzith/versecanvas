import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, Palette, TrendingUp, Briefcase, Eye, Heart, RefreshCw, Sparkles } from 'lucide-react';
import { collection, query, orderBy, getDocs, limit, where } from 'firebase/firestore';
import { db, realtimeDb } from '../lib/firebase';
import { ref, get } from 'firebase/database';
import SocialActions from '../components/SocialActions';

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ทั้งหมด');
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendingStories, setTrendingStories] = useState([]);
  const [trendingArtworks, setTrendingArtworks] = useState([]);

  const tabs = ["ทั้งหมด", "นิยาย", "งานศิลปะ", "กำลังมาแรง"];

  useEffect(() => {
    fetchContent();
  }, []);

  // ดึงยอดวิว/ยอดใจจาก Realtime Database
  const fetchSocialCounts = async (itemId, type) => {
    try {
      const viewRef = ref(realtimeDb, `views/${type}/${itemId}`);
      const likeRef = ref(realtimeDb, `likeCounts/${type}/${itemId}`);
      
      const [viewSnapshot, likeSnapshot] = await Promise.all([
        get(viewRef),
        get(likeRef)
      ]);
      
      return {
        views: viewSnapshot.exists() ? (viewSnapshot.val().count || 0) : 0,
        likes: likeSnapshot.exists() ? (likeSnapshot.val().count || 0) : 0
      };
    } catch (error) {
      console.error('Error fetching social counts:', error);
      return { views: 0, likes: 0 };
    }
  };

  const fetchContent = async () => {
    setLoading(true);
    try {
      // Fetch stories
      const storiesQuery = query(collection(db, 'stories'), orderBy('createdAt', 'desc'), limit(20));
      const storiesSnapshot = await getDocs(storiesQuery);
      const storiesData = await Promise.all(
        storiesSnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const socialCounts = await fetchSocialCounts(doc.id, 'story');
          return {
            id: doc.id,
            type: 'story',
            title: data.title,
            author: data.authorName,
            authorId: data.authorId,
            image: data.coverImage,
            description: data.description,
            category: data.category,
            views: socialCounts.views,
            likes: socialCounts.likes,
            createdAt: data.createdAt?.toDate() || new Date()
          };
        })
      );

      // Fetch artworks
      const artworksQuery = query(collection(db, 'artworks'), orderBy('createdAt', 'desc'), limit(20));
      const artworksSnapshot = await getDocs(artworksQuery);
      const artworksData = await Promise.all(
        artworksSnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const socialCounts = await fetchSocialCounts(doc.id, 'artwork');
          return {
            id: doc.id,
            type: 'artwork',
            title: data.title,
            author: data.artistName,
            authorId: data.artistId,
            image: data.imageUrl,
            description: data.description,
            category: data.category,
            views: socialCounts.views,
            likes: socialCounts.likes,
            createdAt: data.createdAt?.toDate() || new Date()
          };
        })
      );

      // Combine and sort by date
      const allContent = [...storiesData, ...artworksData].sort((a, b) => b.createdAt - a.createdAt);
      setContent(allContent);

      // Set trending (sort by likes)
      setTrendingStories(storiesData.sort((a, b) => b.likes - a.likes).slice(0, 6));
      setTrendingArtworks(artworksData.sort((a, b) => b.likes - a.likes).slice(0, 6));

    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  const filteredContent = content.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'ทั้งหมด' || 
                      (activeTab === 'นิยาย' && item.type === 'story') ||
                      (activeTab === 'งานศิลปะ' && item.type === 'artwork') ||
                      activeTab === 'กำลังมาแรง';
    return matchesSearch && matchesTab;
  });

  // Sort by likes if trending tab
  const displayContent = activeTab === 'กำลังมาแรง' 
    ? [...filteredContent].sort((a, b) => b.likes - a.likes)
    : filteredContent;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 bg-clip-text text-transparent">
            สำรวจ
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            ค้นพบนิยายและงานศิลปะที่น่าสนใจ
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหานิยาย งานศิลปะ หรือผู้สร้างสรรค์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl pl-12 pr-4 py-4 text-lg focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex gap-2 bg-[#1a1a1a] rounded-2xl p-2 border border-[#2a2a2a]">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl font-medium transition ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link
            to="/stories"
            className="group bg-[#1a1a1a] rounded-2xl p-8 border-2 border-transparent hover:border-purple-500 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="w-12 h-12 text-purple-500 group-hover:scale-110 transition-transform" />
              <TrendingUp className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">นิยาย</h3>
            <p className="text-gray-400">
              สำรวจนิยายจากนักเขียนทั่วโลก
            </p>
            <p className="text-sm text-purple-400 mt-2">{trendingStories.length} เรื่อง</p>
          </Link>

          <Link
            to="/artworks"
            className="group bg-[#1a1a1a] rounded-2xl p-8 border-2 border-transparent hover:border-pink-500 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <Palette className="w-12 h-12 text-pink-500 group-hover:scale-110 transition-transform" />
              <TrendingUp className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">งานศิลปะ</h3>
            <p className="text-gray-400">
              ชมงานศิลปะสวยงามจากศิลปินมากความสามารถ
            </p>
            <p className="text-sm text-pink-400 mt-2">{trendingArtworks.length} ชิ้น</p>
          </Link>

          <Link
            to="/artseek"
            className="group bg-[#1a1a1a] rounded-2xl p-8 border-2 border-transparent hover:border-teal-500 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <Briefcase className="w-12 h-12 text-teal-500 group-hover:scale-110 transition-transform" />
              <TrendingUp className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Artseek</h3>
            <p className="text-gray-400">
              ค้นหางานศิลปะและคอมมิชชั่น
            </p>
          </Link>
        </div>

        {/* Trending Section */}
        {activeTab === 'ทั้งหมด' && !searchQuery && (
          <>
            {/* Trending Stories */}
            {trendingStories.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="text-purple-500" />
                    นิยายยอดนิยม
                  </h2>
                  <Link to="/stories" className="text-purple-400 hover:text-purple-300 transition">
                    ดูทั้งหมด →
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {trendingStories.slice(0, 6).map((story) => (
                    <Link
                      key={story.id}
                      to={`/story/${story.id}`}
                      className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-[#1a1a1a]"
                    >
                      <img
                        src={story.image || 'https://via.placeholder.com/200x300'}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-sm font-medium line-clamp-2">{story.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Heart size={10} className="text-pink-400" />
                              {formatNumber(story.likes)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye size={10} className="text-blue-400" />
                              {formatNumber(story.views)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Artworks */}
            {trendingArtworks.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="text-pink-500" />
                    งานศิลปะยอดนิยม
                  </h2>
                  <Link to="/artworks" className="text-pink-400 hover:text-pink-300 transition">
                    ดูทั้งหมด →
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {trendingArtworks.slice(0, 6).map((artwork) => (
                    <Link
                      key={artwork.id}
                      to={`/artwork/${artwork.id}`}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-[#1a1a1a]"
                    >
                      <img
                        src={artwork.image || 'https://via.placeholder.com/200x200'}
                        alt={artwork.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-sm font-medium line-clamp-1">{artwork.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Heart size={10} className="text-pink-400" />
                              {formatNumber(artwork.likes)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye size={10} className="text-blue-400" />
                              {formatNumber(artwork.views)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Content Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {searchQuery ? `ผลการค้นหา "${searchQuery}"` : 'เนื้อหาทั้งหมด'}
            </h2>
            <button
              onClick={fetchContent}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500 transition"
            >
              <RefreshCw size={16} />
              รีเฟรช
            </button>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
              <p className="text-gray-400">กำลังโหลด...</p>
            </div>
          ) : displayContent.length === 0 ? (
            <div className="text-center py-20">
              <Search className="w-20 h-20 mx-auto mb-4 text-gray-600" />
              <p className="text-xl text-gray-400 mb-2">
                {searchQuery ? 'ไม่พบผลลัพธ์' : 'ยังไม่มีเนื้อหา'}
              </p>
              <p className="text-gray-500">
                {searchQuery 
                  ? 'ลองค้นหาด้วยคำอื่น' 
                  : 'ลองสร้างนิยายหรืองานศิลปะของคุณเองสิ!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayContent.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  to={item.type === 'story' ? `/story/${item.id}` : `/artwork/${item.id}`}
                  className="group bg-[#1a1a1a] rounded-2xl overflow-hidden border-2 border-transparent hover:border-purple-500 transition-all"
                >
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={item.image || 'https://via.placeholder.com/400x400'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.type === 'story' 
                          ? 'bg-purple-500/80 text-white' 
                          : 'bg-pink-500/80 text-white'
                      }`}>
                        {item.type === 'story' ? 'นิยาย' : 'งานศิลปะ'}
                      </span>
                    </div>
                    {/* Stats Badge */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full text-xs text-white">
                        <Heart size={10} className="text-pink-400" />
                        {formatNumber(item.likes)}
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full text-xs text-white">
                        <Eye size={10} className="text-blue-400" />
                        {formatNumber(item.views)}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-2 group-hover:text-purple-400 transition line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">โดย {item.author}</p>
                    {item.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.description}</p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye size={16} className="text-blue-400" />
                        {formatNumber(item.views)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={16} className="text-pink-400" />
                        {formatNumber(item.likes)}
                      </span>
                      {item.category && (
                        <span className="text-xs bg-[#2a2a2a] px-2 py-1 rounded-full">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explore;
