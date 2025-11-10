import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Palette, Search, Plus, Eye, Heart, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SocialActions from '../components/SocialActions';
import CommentSection from '../components/CommentSection';

const Artworks = ({ currentLanguage }) => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const { currentUser } = useAuth();

  const categories = ['ทั้งหมด', 'ภาพวาด', 'ดิจิทัลอาร์ต', 'ภาพถ่าย', 'ภาพประกอบ', 'การออกแบบ', 'อื่นๆ'];

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'artworks'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const artworksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      
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
    const matchesSearch = artwork.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         artwork.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleArtworkClick = (artwork) => {
    setSelectedArtwork(artwork);
    setShowComments(true);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
              <Palette className="w-8 h-8 text-purple-500" />
              งานศิลปะ
            </h1>
            <p className="text-gray-400">ชมและแบ่งปันผลงานศิลปะที่สวยงาม</p>
          </div>

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

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหางานศิลปะ..."
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

        {/* Artworks Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">กำลังโหลด...</p>
          </div>
        ) : filteredArtworks.length === 0 ? (
          <div className="text-center py-12">
            <Palette className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400">ไม่พบงานศิลปะ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArtworks.map((artwork) => (
              <div
                key={artwork.id}
                className="bg-[#1a1a1a] rounded-2xl overflow-hidden border-2 border-transparent hover:border-purple-500 transition-all group cursor-pointer"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-sm text-gray-300 line-clamp-2">{artwork.description}</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-purple-400 transition">
                    {artwork.title}
                  </h3>

                  {/* Artist */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                      {artwork.artistName[0]}
                    </div>
                    <span className="text-sm text-gray-400">{artwork.artistName}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Eye size={16} />
                        {artwork.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={16} />
                        {artwork.likes}
                      </span>
                    </div>
                    <span className="text-xs bg-[#2a2a2a] px-3 py-1 rounded-full">
                      {artwork.category}
                    </span>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleArtworkClick(artwork)}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 font-medium transition"
                  >
                    ดูรายละเอียด
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Artwork Detail Modal */}
      {selectedArtwork && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1a1a1a] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              {/* Close Button */}
              <button
                onClick={() => {
                  setSelectedArtwork(null);
                  setShowComments(false);
                }}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition"
              >
                ✕
              </button>

              {/* Image */}
              <img
                src={selectedArtwork.imageUrl}
                alt={selectedArtwork.title}
                className="w-full max-h-[60vh] object-contain bg-black"
              />

              {/* Content */}
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-2">{selectedArtwork.title}</h2>
                <p className="text-gray-400 mb-4">{selectedArtwork.description}</p>

                {/* Artist */}
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#2a2a2a]">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-lg font-bold">
                    {selectedArtwork.artistName[0]}
                  </div>
                  <div>
                    <p className="font-medium">{selectedArtwork.artistName}</p>
                    <p className="text-sm text-gray-400">{selectedArtwork.category}</p>
                  </div>
                </div>

                {/* Social Actions */}
                <div className="mb-6">
                  <SocialActions
                    postId={selectedArtwork.id}
                    postType="artwork"
                    onCommentClick={() => setShowComments(true)}
                  />
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-gray-400">
                  <span className="flex items-center gap-2">
                    <Eye size={16} />
                    {selectedArtwork.views} ครั้ง
                  </span>
                  <span>•</span>
                  <span>{new Date(selectedArtwork.createdAt).toLocaleDateString('th-TH')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comment Section */}
      {selectedArtwork && (
        <CommentSection
          postId={selectedArtwork.id}
          postType="artwork"
          isOpen={showComments}
          onClose={() => setShowComments(false)}
        />
      )}
    </div>
  );
};

export default Artworks;
