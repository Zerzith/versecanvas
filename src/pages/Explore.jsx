import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, Palette, TrendingUp, Briefcase, Eye, Heart } from 'lucide-react';
import SocialActions from '../components/SocialActions';

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ทั้งหมด');

  const tabs = ['ทั้งหมด', 'เรื่องราว', 'งานศิลปะ', 'กำลังมาแรง'];

  // Data will be loaded from Firebase
  const [content, setContent] = useState([]);
  
  const filteredContent = content.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.author?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'ทั้งหมด' || 
                      (activeTab === 'เรื่องราว' && item.type === 'story') ||
                      (activeTab === 'งานศิลปะ' && item.type === 'artwork') ||
                      activeTab === 'กำลังมาแรง';
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 bg-clip-text text-transparent">
            สำรวจ
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            ค้นพบเรื่องราวและงานศิลปะที่น่าสนใจ
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาเรื่องราว งานศิลปะ หรือผู้สร้างสรรค์..."
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
            <h3 className="text-2xl font-bold mb-2">เรื่องราว</h3>
            <p className="text-gray-400">
              สำรวจนิยายและเรื่องราวจากนักเขียนทั่วโลก
            </p>
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

        {/* Content Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6">เนื้อหาแนะนำ</h2>
          {filteredContent.length === 0 ? (
            <div className="text-center py-20">
              <Search className="w-20 h-20 mx-auto mb-4 text-gray-600" />
              <p className="text-xl text-gray-400 mb-2">ยังไม่มีเนื้อหา</p>
              <p className="text-gray-500">ลองสร้างเรื่องราวหรืองานศิลปะของคุณเองสิ!</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.map((item) => (
              <Link
                key={item.id}
                to={item.type === 'story' ? `/story/${item.id}` : `/artwork/${item.id}`}
                className="group bg-[#1a1a1a] rounded-2xl overflow-hidden border-2 border-transparent hover:border-purple-500 transition-all"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.type === 'story' 
                        ? 'bg-purple-500/80 text-white' 
                        : 'bg-pink-500/80 text-white'
                    }`}>
                      {item.type === 'story' ? 'เรื่องราว' : 'งานศิลปะ'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-purple-400 transition line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">โดย {item.author}</p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Eye size={16} />
                      {item.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart size={16} />
                      {item.likes}
                    </span>
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
