import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Plus, Eye, Heart, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from '../components/UserAvatar';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db, realtimeDb } from '../lib/firebase';
import { ref, get } from 'firebase/database';

const Stories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const { currentUser } = useAuth();

  const categories = ['ทั้งหมด', 'นิยายรัก', 'แฟนตาซี', 'ผจญภัย', 'สยองขวัญ', 'วิทยาศาสตร์', 'อื่นๆ'];

  useEffect(() => {
    fetchStories();
  }, []);

  // ดึงยอดวิว/ยอดใจจาก Realtime Database
  const fetchSocialCounts = async (storyId) => {
    try {
      const viewRef = ref(realtimeDb, `views/story/${storyId}`);
      const likeRef = ref(realtimeDb, `likeCounts/story/${storyId}`);
      
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

  const fetchStories = async () => {
    setLoading(true);
    try {
      // ดึง stories ทั้งหมดแล้วกรองด้วย JavaScript
      const q = query(
        collection(db, 'stories'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const storiesData = await Promise.all(
        querySnapshot.docs
          .filter(doc => !doc.data().hidden) // กรอง hidden ด้วย JavaScript
          .map(async (doc) => {
            const data = doc.data();
            // ดึงยอดวิว/ยอดใจจาก Realtime Database
            const socialCounts = await fetchSocialCounts(doc.id);
          
          return {
            id: doc.id,
            ...data,
            views: socialCounts.views,
            likes: socialCounts.likes,
            createdAt: data.createdAt?.toDate() || new Date()
          };
        })
      );
      
      setStories(storiesData);
    } catch (error) {
      console.error('Error fetching stories:', error);
      setStories([]);
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

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ทั้งหมด' || story.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-purple-500" />
              นิยาย
            </h1>
            <p className="text-gray-400">สำรวจนิยายที่น่าสนใจจากนักเขียนทั่วโลก</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStories}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500 transition"
            >
              <RefreshCw size={16} />
              รีเฟรช
            </button>
            {currentUser && (
              <Link
                to="/create-story"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 font-medium transition"
              >
                <Plus size={20} />
                สร้างนิยาย
              </Link>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหานิยาย..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto mb-8 pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Stories Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">กำลังโหลด...</p>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400">ไม่พบนิยาย</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <Link
                key={story.id}
                to={`/story/${story.id}`}
                className="group bg-[#1a1a1a] rounded-2xl overflow-hidden border-2 border-transparent hover:border-purple-500 transition-all"
              >
                {/* Cover Image */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={story.coverImage || 'https://via.placeholder.com/300x400'}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-sm text-gray-300 line-clamp-2">{story.description}</p>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="bg-purple-600 px-3 py-1 rounded-full text-xs font-medium">
                      {story.status || 'กำลังเขียน'}
                    </span>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                      {story.chapters || 0} ตอน
                    </span>
                  </div>
                  
                  {/* Stats Badge */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full text-xs text-white">
                      <Heart size={12} className="text-pink-400" />
                      {formatNumber(story.likes || 0)}
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full text-xs text-white">
                      <Eye size={12} className="text-blue-400" />
                      {formatNumber(story.views || 0)}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-purple-400 transition line-clamp-2">
                    {story.title}
                  </h3>

	                  {/* Author */}
	                  <div 
	                    className="flex items-center gap-2 mb-3 cursor-pointer hover:opacity-80 transition"
	                    onClick={(e) => {
	                      e.preventDefault();
	                      e.stopPropagation();
	                      window.location.href = `/profile/${story.authorId}`;
	                    }}
	                  >
	                    <UserAvatar 
	                      userId={story.authorId} 
	                      className="w-6 h-6" 
	                    />
	                    <UserAvatar 
	                      userId={story.authorId} 
	                      showName={true} 
	                      className="hidden" 
	                      nameClassName="text-sm text-gray-400 hover:text-purple-400 transition"
	                    />
	                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Eye size={16} className="text-blue-400" />
                        {formatNumber(story.views || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={16} className="text-pink-400" />
                        {formatNumber(story.likes || 0)}
                      </span>
                    </div>
                    <span className="text-xs bg-[#2a2a2a] px-3 py-1 rounded-full">
                      {story.category}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stories;
