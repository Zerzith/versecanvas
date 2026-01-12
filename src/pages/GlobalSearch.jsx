import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Search, User, BookOpen, Palette, ShoppingBag, Briefcase, TrendingUp, Clock, X } from 'lucide-react';

export default function GlobalSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState({
    users: [],
    stories: [],
    artworks: [],
    products: [],
    jobs: []
  });
  const [recentSearches, setRecentSearches] = useState([]);
  const [popularSearches] = useState([
    'นิยายรัก', 'ภาพวาด', 'ดิจิทัลอาร์ต', 'คอมมิชชั่น', 'E-book'
  ]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    // โหลดประวัติการค้นหา
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 500); // Debounce 500ms

      return () => clearTimeout(timer);
    } else {
      setResults({
        users: [],
        stories: [],
        artworks: [],
        products: [],
        jobs: []
      });
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const searchLower = searchQuery.toLowerCase();

      // ค้นหาผู้ใช้
      const usersSnapshot = await getDocs(
        query(collection(db, 'users'), limit(5))
      );
      const users = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => 
          user.displayName?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower)
        );

      // ค้นหานิยาย
      const storiesSnapshot = await getDocs(
        query(collection(db, 'stories'), orderBy('createdAt', 'desc'), limit(20))
      );
      const stories = storiesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(story =>
          story.title?.toLowerCase().includes(searchLower) ||
          story.description?.toLowerCase().includes(searchLower)
        );

      // ค้นหาผลงานศิลปะ
      const artworksSnapshot = await getDocs(
        query(collection(db, 'artworks'), orderBy('createdAt', 'desc'), limit(20))
      );
      const artworks = artworksSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(artwork =>
          artwork.title?.toLowerCase().includes(searchLower) ||
          artwork.description?.toLowerCase().includes(searchLower)
        );

      // ค้นหาสินค้า
      const productsSnapshot = await getDocs(
        query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(20))
      );
      const products = productsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(product =>
          product.title?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower)
        );

      // ค้นหางาน
      const jobsSnapshot = await getDocs(
        query(collection(db, 'jobs'), orderBy('createdAt', 'desc'), limit(20))
      );
      const jobs = jobsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(job =>
          job.title?.toLowerCase().includes(searchLower) ||
          job.description?.toLowerCase().includes(searchLower)
        );

      setResults({
        users: users.slice(0, 5),
        stories: stories.slice(0, 5),
        artworks: artworks.slice(0, 5),
        products: products.slice(0, 5),
        jobs: jobs.slice(0, 5)
      });

      // บันทึกประวัติการค้นหา
      saveRecentSearch(searchQuery);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearching(false);
    }
  };

  const saveRecentSearch = (query) => {
    const updated = [query, ...recentSearches.filter(q => q !== query)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

  const tabs = [
    { id: 'all', label: 'ทั้งหมด', count: totalResults },
    { id: 'users', label: 'ผู้ใช้', count: results.users.length },
    { id: 'stories', label: 'นิยาย', count: results.stories.length },
    { id: 'artworks', label: 'ผลงาน', count: results.artworks.length },
    { id: 'products', label: 'สินค้า', count: results.products.length },
    { id: 'jobs', label: 'งาน', count: results.jobs.length }
  ];

  const filteredResults = activeTab === 'all' ? results : {
    [activeTab]: results[activeTab]
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            ค้นหา
          </h1>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหานิยาย, ผลงาน, ผู้ใช้, สินค้า, งาน..."
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl pl-12 pr-4 py-4 text-lg focus:outline-none focus:border-purple-500"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-[#2a2a2a] rounded-full transition"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Recent & Popular Searches */}
        {!searchQuery && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <Clock size={20} className="text-purple-400" />
                    ค้นหาล่าสุด
                  </h3>
                  <button
                    onClick={clearRecentSearches}
                    className="text-sm text-gray-400 hover:text-white transition"
                  >
                    ล้างทั้งหมด
                  </button>
                </div>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchQuery(search)}
                      className="w-full text-left px-4 py-2 rounded-lg hover:bg-[#2a2a2a] transition"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-pink-400" />
                คำค้นหายอดนิยม
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchQuery(search)}
                    className="px-4 py-2 rounded-full bg-[#2a2a2a] hover:bg-purple-600 transition"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchQuery && (
          <>
            {/* Tabs */}
            <div className="flex gap-4 overflow-x-auto mb-6 pb-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                      : 'bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Loading */}
            {searching && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-400">กำลังค้นหา...</p>
              </div>
            )}

            {/* Results */}
            {!searching && totalResults === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">ไม่พบผลลัพธ์สำหรับ "{searchQuery}"</p>
              </div>
            )}

            {!searching && totalResults > 0 && (
              <div className="space-y-8">
                {/* Users */}
                {(activeTab === 'all' || activeTab === 'users') && filteredResults.users?.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <User size={20} className="text-purple-400" />
                      ผู้ใช้ ({results.users.length})
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      {filteredResults.users.map(user => (
                        <Link
                          key={user.id}
                          to={`/profile/${user.id}`}
                          className="flex items-center gap-4 p-4 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500 transition"
                        >
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center overflow-hidden">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                            ) : (
                              <User size={24} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{user.displayName || 'ผู้ใช้'}</p>
                            <p className="text-sm text-gray-400">{user.email}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stories */}
                {(activeTab === 'all' || activeTab === 'stories') && filteredResults.stories?.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <BookOpen size={20} className="text-blue-400" />
                      นิยาย ({results.stories.length})
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      {filteredResults.stories.map(story => (
                        <Link
                          key={story.id}
                          to={`/story/${story.id}`}
                          className="flex gap-4 p-4 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500 transition"
                        >
                          {story.coverImage && (
                            <img
                              src={story.coverImage}
                              alt={story.title}
                              className="w-20 h-28 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-medium mb-1">{story.title}</h3>
                            <p className="text-sm text-gray-400 line-clamp-2">{story.description}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Artworks */}
                {(activeTab === 'all' || activeTab === 'artworks') && filteredResults.artworks?.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Palette size={20} className="text-pink-400" />
                      ผลงานศิลปะ ({results.artworks.length})
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {filteredResults.artworks.map(artwork => (
                        <Link
                          key={artwork.id}
                          to={`/artwork/${artwork.id}`}
                          className="aspect-square rounded-xl overflow-hidden bg-[#1a1a1a] hover:scale-105 transition"
                        >
                          <img
                            src={artwork.imageUrl}
                            alt={artwork.title}
                            className="w-full h-full object-cover"
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products */}
                {(activeTab === 'all' || activeTab === 'products') && filteredResults.products?.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <ShoppingBag size={20} className="text-green-400" />
                      สินค้า ({results.products.length})
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {filteredResults.products.map(product => (
                        <Link
                          key={product.id}
                          to="/shop"
                          className="rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500 transition"
                        >
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full aspect-square object-cover"
                          />
                          <div className="p-4">
                            <h3 className="font-medium mb-2">{product.title}</h3>
                            <p className="text-purple-400 font-bold">{product.price} เครดิต</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Jobs */}
                {(activeTab === 'all' || activeTab === 'jobs') && filteredResults.jobs?.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Briefcase size={20} className="text-orange-400" />
                      งาน ({results.jobs.length})
                    </h2>
                    <div className="space-y-4">
                      {filteredResults.jobs.map(job => (
                        <Link
                          key={job.id}
                          to={`/job/${job.id}`}
                          className="block p-4 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500 transition"
                        >
                          <h3 className="font-medium mb-2">{job.title}</h3>
                          <p className="text-sm text-gray-400 mb-2 line-clamp-2">{job.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-purple-400 font-bold">{job.budget} เครดิต</span>
                            <span className="text-gray-400">{job.category}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
