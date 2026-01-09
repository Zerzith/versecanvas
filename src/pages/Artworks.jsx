import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs, limit, where } from 'firebase/firestore';
import { db, realtimeDb } from '../lib/firebase';
import { ref, get } from 'firebase/database';
import { Palette, Search, Plus, Eye, Heart, MessageCircle, TrendingUp, RefreshCw, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocial } from '../contexts/SocialContext';
import SocialActions from '../components/SocialActions';
import CommentSection from '../components/CommentSection';
import UserAvatar from '../components/UserAvatar';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const Artworks = ({ currentLanguage }) => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [sortBy, setSortBy] = useState('popular');
  const { currentUser } = useAuth();
  const { incrementView, toggleBookmark, isBookmarked } = useSocial();
  const [bookmarked, setBookmarked] = useState(false);

  const categories = ['ทั้งหมด', 'ภาพวาด', 'ดิจิทัลอาร์ต', 'ภาพถ่าย', 'ภาพประกอบ', 'การออกแบบ', 'อื่นๆ'];
  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'following', label: 'Following' },
    { id: 'works', label: 'Works' }
  ];

  useEffect(() => {
    fetchArtworks();
  }, [activeTab, sortBy]);

  // ดึงยอดวิว/ยอดใจจาก Realtime Database
  const fetchSocialCounts = async (artworkId) => {
    try {
      const viewRef = ref(realtimeDb, `views/artwork/${artworkId}`);
      const likeRef = ref(realtimeDb, `likeCounts/artwork/${artworkId}`);
      
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

  const fetchArtworks = async () => {
    setLoading(true);
    try {
      let q;
      if (sortBy === 'popular') {
        q = query(collection(db, 'artworks'), orderBy('createdAt', 'desc'), limit(50));
      } else {
        q = query(collection(db, 'artworks'), orderBy('createdAt', 'desc'), limit(50));
      }
      
      const querySnapshot = await getDocs(q);
      const artworksData = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          // ดึงยอดวิว/ยอดใจจาก Realtime Database
          const socialCounts = await fetchSocialCounts(doc.id);
          
          return {
            id: doc.id,
            type: 'artwork',
            ...data,
            views: socialCounts.views,
            likes: socialCounts.likes,
            createdAt: data.createdAt?.toDate() || new Date()
          };
        })
      );
      
      // เรียงตามยอดไลค์ถ้าเลือก popular
      if (sortBy === 'popular') {
        artworksData.sort((a, b) => b.likes - a.likes);
      }
      
      setArtworks(artworksData);
    } catch (error) {
      console.error('Error fetching artworks:', error);
      setArtworks([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredArtworks = artworks.filter(artwork => {
    const matchesCategory = selectedCategory === 'ทั้งหมด' || artwork.category === selectedCategory;
    const matchesSearch = artwork.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         artwork.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleArtworkClick = async (artwork) => {
    setSelectedArtwork(artwork);
    setShowComments(true);
    // เพิ่มยอดวิว
    await incrementView(artwork.id, 'artwork');
    
    // ตรวจสอบสถานะการบันทึก
    if (currentUser) {
      const status = await isBookmarked(artwork.id);
      setBookmarked(status);
    }
  };

  const handleBookmark = async () => {
    if (!currentUser || !selectedArtwork) return;
    const result = await toggleBookmark(selectedArtwork.id, 'artwork', {
      title: selectedArtwork.title,
      imageUrl: selectedArtwork.imageUrl || selectedArtwork.image,
      artistId: selectedArtwork.artistId
    });
    setBookmarked(result);
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

  const formatDate = (date) => {
    if (!date) return 'ไม่ระบุวันที่';
    try {
      return format(date, 'd MMMM yyyy', { locale: th });
    } catch (e) {
      return 'ไม่ระบุวันที่';
    }
  };

  const ArtworkCard = ({ item }) => {
    const isProduct = item.type === 'product';
    const imageUrl = isProduct ? item.image : item.imageUrl;
    const title = isProduct ? item.title : item.title;
    const likes = item.likes || 0;
    const views = item.views || 0;
    const artistName = isProduct ? item.seller : item.artistName;

    return (
      <div
        onClick={() => handleArtworkClick(item)}
        className="group relative block overflow-hidden rounded-xl bg-[#1a1a1a] hover:scale-[1.02] transition-transform duration-300 cursor-pointer break-inside-avoid mb-4"
      >
        <div className="relative">
          <img
            src={imageUrl || 'https://via.placeholder.com/400x600'}
            alt={title}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-white font-medium mb-2 line-clamp-2">{title}</p>
              <div className="flex items-center justify-between text-white/80 text-sm">
                <span className="hover:text-purple-400 transition">
                  {item.artistId ? (
                    <UserAvatar 
                      userId={item.artistId} 
                      showName={true} 
                      className="hidden" 
                      nameClassName="hover:text-purple-400 transition"
                    />
                  ) : artistName}
                </span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Heart size={14} className="text-pink-400" />
                    {formatNumber(likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={14} className="text-blue-400" />
                    {formatNumber(views)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Badge */}
          {isProduct && (
            <div className="absolute top-2 right-2 px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
              ขาย
            </div>
          )}
          
          {/* Stats Badge - แสดงตลอดเวลา */}
          <div className="absolute top-2 left-2 flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full text-xs text-white">
              <Heart size={12} className="text-pink-400" />
              {formatNumber(likes)}
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full text-xs text-white">
              <Eye size={12} className="text-blue-400" />
              {formatNumber(views)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
              <Palette className="w-8 h-8 text-purple-500" />
              Artworks
            </h1>
            <p className="text-gray-400">ค้นพบผลงานศิลปะที่น่าสนใจ</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchArtworks}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500 transition"
            >
              <RefreshCw size={16} />
              รีเฟรช
            </button>
            {currentUser && (
              <Link
                to="/upload-artwork"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 font-medium transition"
              >
                <Plus size={20} />
                อัปโหลดงานศิลปะ
              </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-8 border-b border-[#2a2a2a]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-2 font-medium transition relative ${
                activeTab === tab.id
                  ? 'text-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500"></div>
              )}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-gray-400">เรียงตาม:</span>
          <button
            onClick={() => setSortBy('popular')}
            className={`px-4 py-2 rounded-lg transition ${
              sortBy === 'popular'
                ? 'bg-purple-500 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
            }`}
          >
            ยอดนิยม
          </button>
          <button
            onClick={() => setSortBy('latest')}
            className={`px-4 py-2 rounded-lg transition ${
              sortBy === 'latest'
                ? 'bg-purple-500 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
            }`}
          >
            ล่าสุด
          </button>
        </div>

        {/* Art Trends Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="text-pink-500" />
              Art Trends
            </h2>
            <Link
              to="/explore"
              className="text-purple-400 hover:text-purple-300 text-sm font-medium transition"
            >
              See More →
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {artworks.slice(0, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => handleArtworkClick(item)}
                className="group relative aspect-square rounded-xl overflow-hidden bg-[#1a1a1a] cursor-pointer"
              >
                <img
                  src={item.type === 'product' ? item.image : item.imageUrl}
                  alt="Trend"
                  className="w-full h-full object-cover"
                />
                {/* Stats overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <span className="flex items-center gap-1 text-white text-sm">
                    <Heart size={14} className="text-pink-400" />
                    {formatNumber(item.likes || 0)}
                  </span>
                  <span className="flex items-center gap-1 text-white text-sm">
                    <Eye size={14} className="text-blue-400" />
                    {formatNumber(item.views || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหาผลงาน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-purple-500 transition"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Artworks Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">กำลังโหลด...</p>
          </div>
        ) : filteredArtworks.length === 0 ? (
          <div className="text-center py-12">
            <Palette className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400">ไม่พบผลงาน</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {filteredArtworks.map((artwork) => (
              <ArtworkCard key={artwork.id} item={artwork} />
            ))}
          </div>
        )}

        {/* Artwork Modal */}
        {selectedArtwork && showComments && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-6 p-6">
                {/* Image */}
                <div className="aspect-square rounded-xl overflow-hidden bg-[#2a2a2a]">
                  <img
                    src={selectedArtwork.imageUrl || selectedArtwork.image}
                    alt={selectedArtwork.title}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Details */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">{selectedArtwork.title}</h2>
                    <button
                      onClick={() => {
                        setSelectedArtwork(null);
                        setShowComments(false);
                      }}
                      className="p-2 hover:bg-[#2a2a2a] rounded-lg transition"
                    >
                      ✕
                    </button>
                  </div>

                  <Link
                    to={`/profile/${selectedArtwork.artistId}`}
                    className="flex items-center gap-3 mb-4 hover:opacity-80 transition"
                  >
                    <UserAvatar 
                      userId={selectedArtwork.artistId} 
                      showName={true} 
                      className="w-10 h-10"
                      nameClassName="font-medium"
                    />
                  </Link>

                  <p className="text-gray-400 mb-4">{selectedArtwork.description}</p>

                  {/* Stats & Date */}
                  <div className="flex flex-col gap-2 mb-4 text-sm text-gray-400">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Heart size={16} className="text-pink-400" />
                        {formatNumber(selectedArtwork.likes || 0)} ถูกใจ
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={16} className="text-blue-400" />
                        {formatNumber(selectedArtwork.views || 0)} เข้าชม
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar size={14} />
                      <span>อัปโหลดเมื่อ: {formatDate(selectedArtwork.createdAt)}</span>
                    </div>
                  </div>

                  {/* Social Actions */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <SocialActions
                        postId={selectedArtwork.id}
                        postType="artwork"
                        onCommentClick={() => {}}
                      />
                    </div>
                    <button
                      onClick={handleBookmark}
                      className={`p-2 rounded-lg border transition ${
                        bookmarked 
                          ? 'bg-purple-600/20 border-purple-500 text-purple-400' 
                          : 'bg-transparent border-[#3a3a3a] text-gray-400 hover:bg-[#2a2a2a]'
                      }`}
                      title={bookmarked ? "ยกเลิกการบันทึก" : "บันทึกรายการโปรด"}
                    >
                      <Bookmark size={20} fill={bookmarked ? "currentColor" : "none"} />
                    </button>
                  </div>

                  {/* Comments */}
                  <div className="mt-4 flex-1 overflow-y-auto">
                    <CommentSection
                      postId={selectedArtwork.id}
                      postType="artwork"
                      isOpen={showComments}
                      onClose={() => {
                        setSelectedArtwork(null);
                        setShowComments(false);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Artworks;
