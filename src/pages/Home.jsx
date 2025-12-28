import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, Users, BookOpen, Palette } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Home() {
  const [stats, setStats] = useState({
    users: 0,
    stories: 0,
    artworks: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

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
                <Palette className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">แชร์ผลงาน</h3>
              <p className="text-gray-400 text-sm">
                อัปโหลดงานศิลปะของคุณ รับไลค์และคอมเมนต์จากชุมชน
              </p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] hover:border-teal-500 transition-all">
              <div className="w-12 h-12 rounded-lg bg-teal-500/20 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-teal-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">จ้างงาน</h3>
              <p className="text-gray-400 text-sm">
                หาศิลปินรับทำงาน Commission หรือเสนอบริการของคุณ
              </p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] hover:border-yellow-500 transition-all">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">ซื้อขาย</h3>
              <p className="text-gray-400 text-sm">
                ซื้อและขายผลงานดิจิทัล ใช้ระบบเครดิตที่ปลอดภัย
              </p>
            </div>
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
