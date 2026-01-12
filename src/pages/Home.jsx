import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, Users, BookOpen, Palette, ShoppingCart, Handshake, Share2, Star, Clock, ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';
import UserAvatar from '../components/UserAvatar';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Home() {
  const [stats, setStats] = useState({
    users: 0,
    stories: 0,
    artworks: 0
  });
  const [popularStories, setPopularStories] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [newStories, setNewStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Refresh data every 30 seconds to show latest sales
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadPopularStories(),
        loadPopularProducts(),
        loadNewStories()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Count users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersCount = usersSnapshot.size;

      // Count stories
      const storiesSnapshot = await getDocs(collection(db, 'stories'));
      const storiesCount = storiesSnapshot.size;

      // Count artworks
      const artworksSnapshot = await getDocs(collection(db, 'artworks'));
      const artworksCount = artworksSnapshot.size;

      setStats({
        users: usersCount,
        stories: storiesCount,
        artworks: artworksCount
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadPopularStories = async () => {
    try {
      const storiesRef = collection(db, 'stories');
      const snapshot = await getDocs(storiesRef);
      const stories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by views or likes (simulated for now)
      const sorted = stories.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);
      setPopularStories(sorted);
    } catch (error) {
      console.error('Error loading popular stories:', error);
    }
  };

  const loadPopularProducts = async () => {
    try {
      const productsRef = collection(db, 'products');
      const snapshot = await getDocs(productsRef);
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by sales or rating
      const sorted = products.sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 4);
      setPopularProducts(sorted);
    } catch (error) {
      console.error('Error loading popular products:', error);
    }
  };

  const loadNewStories = async () => {
    try {
      const storiesRef = collection(db, 'stories');
      const snapshot = await getDocs(storiesRef);
      const stories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by created date
      const sorted = stories.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 4);
      setNewStories(sorted);
    } catch (error) {
      console.error('Error loading new stories:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <main className="pt-24 pb-12">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="text-center space-y-6 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold gradient-text">
              VerseCanvas
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              แพลตฟอร์มที่ผสมผสานการเขียนนิยายและงานศิลปะเข้าด้วยกัน
            </p>
            <div className="flex items-center justify-center space-x-4 pt-4">
              <Link
                to="/explore"
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:from-pink-600 hover:to-purple-600 transition-all hover:scale-105"
              >
                สำรวจผลงาน
              </Link>
            </div>
          </div>
        </section>



        {/* Features */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">ฟีเจอร์หลัก</h2>
            <p className="text-gray-400">สิ่งที่คุณสามารถทำได้บน VerseCanvas</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] hover:border-pink-500 transition-all">
              <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">เขียนนิยาย</h3>
              <p className="text-gray-400 text-sm">
                สร้างและเผยแพร่นิยายของคุณ แบ่งเป็นตอนๆ และรับคอมเมนต์จากผู้อ่าน
              </p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] hover:border-purple-500 transition-all">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                <Share2 className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">แชร์ผลงาน</h3>
              <p className="text-gray-400 text-sm">
                อัปโหลดงานศิลปะของคุณ รับไลค์และคอมเมนต์จากชุมชน
              </p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] hover:border-teal-500 transition-all">
              <div className="w-12 h-12 rounded-lg bg-teal-500/20 flex items-center justify-center mb-4">
                <Handshake className="w-6 h-6 text-teal-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">จ้างงาน</h3>
              <p className="text-gray-400 text-sm">
                หาศิลปินรับทำงาน Commission หรือเสนอบริการของคุณ
              </p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] hover:border-yellow-500 transition-all">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center mb-4">
                <ShoppingCart className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">ซื้อขาย</h3>
              <p className="text-gray-400 text-sm">
                ซื้อและขายผลงานดิจิทัล ใช้ระบบเครดิตที่ปลอดภัย
              </p>
            </div>
          </div>
        </section>

        {/* Popular Stories Ranking */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-pink-500" />
              </div>
              <h2 className="text-2xl font-bold text-white">10 อันดับนิยายฮิตในเดือนนี้</h2>
            </div>
            <Link to="/stories" className="text-purple-400 hover:text-purple-300 text-sm font-medium">ดูทั้งหมด</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {popularStories.map((story, index) => (
              <Link 
                key={story.id} 
                to={`/story/${story.id}`}
                className="group bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a] hover:border-pink-500/50 transition-all"
              >
                <div className="aspect-[3/4] relative">
                  <img 
                    src={story.coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop'} 
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 w-8 h-8 bg-black/60 backdrop-blur-md rounded-lg flex items-center justify-center font-bold text-pink-500 border border-pink-500/30">
                    {index + 1}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-white font-medium text-sm truncate group-hover:text-pink-500 transition-colors">{story.title}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-gray-500 text-xs">โดย</span>
                    <UserAvatar 
                      userId={story.authorId} 
                      showName={true} 
                      className="hidden" 
                      nameClassName="text-gray-500 text-xs truncate"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Popular Products */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold text-white">สินค้ายอดฮิต</h2>
            </div>
            <Link to="/shop" className="text-purple-400 hover:text-purple-300 text-sm font-medium">ไปที่ร้านค้า</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularProducts.length > 0 ? popularProducts.map((product) => (
              <Link 
                key={product.id} 
                to="/shop"
                className="group bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a] hover:border-yellow-500/50 transition-all"
              >
                <div className="aspect-square relative">
                  <img 
                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop'} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-white font-medium truncate group-hover:text-yellow-500 transition-colors">{product.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-yellow-500 font-bold">{product.price} เครดิต</span>
                    <span className="text-gray-500 text-xs">ขายไปแล้ว {product.sales || 0} ชิ้น</span>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="col-span-full py-12 text-center bg-[#1a1a1a] rounded-xl border border-dashed border-[#2a2a2a]">
                <p className="text-gray-500">ยังไม่มีสินค้า</p>
              </div>
            )}
          </div>
        </section>

        {/* New Stories */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-teal-500" />
              </div>
              <h2 className="text-2xl font-bold text-white">นิยายเข้ามาใหม่</h2>
            </div>
            <Link to="/stories" className="text-purple-400 hover:text-purple-300 text-sm font-medium">ดูทั้งหมด</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newStories.map((story) => (
              <Link 
                key={story.id} 
                to={`/story/${story.id}`}
                className="group bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a] hover:border-teal-500/50 transition-all"
              >
                <div className="aspect-[3/4] relative">
                  <img 
                    src={story.coverImage || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop'} 
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2 px-2 py-1 bg-teal-500 text-white text-[10px] font-bold rounded uppercase">
                    New
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-medium truncate group-hover:text-teal-500 transition-colors">{story.title}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-gray-500 text-xs">โดย</span>
                    <UserAvatar 
                      userId={story.authorId} 
                      showName={true} 
                      className="hidden" 
                      nameClassName="text-gray-500 text-xs truncate"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20 rounded-xl p-6 text-center">
              <Users className="w-12 h-12 text-pink-500 mx-auto mb-3" />
              <p className="text-3xl font-bold text-white mb-2">{stats.users}</p>
              <p className="text-gray-400">นักสร้างสรรค์</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-6 text-center">
              <BookOpen className="w-12 h-12 text-purple-500 mx-auto mb-3" />
              <p className="text-3xl font-bold text-white mb-2">{stats.stories}</p>
              <p className="text-gray-400">นิยาย</p>
            </div>
            <div className="bg-gradient-to-br from-teal-500/10 to-teal-500/5 border border-teal-500/20 rounded-xl p-6 text-center">
              <Palette className="w-12 h-12 text-teal-500 mx-auto mb-3" />
              <p className="text-3xl font-bold text-white mb-2">{stats.artworks}</p>
              <p className="text-gray-400">งานศิลปะ</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
