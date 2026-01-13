import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { TrendingUp, Users, BookOpen, DollarSign, Activity } from 'lucide-react';

export default function Analytics() {
  const [stats, setStats] = useState({
    userGrowth: [],
    contentGrowth: [],
    revenueGrowth: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Get users
      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get stories
      const storiesSnap = await getDocs(collection(db, 'stories'));
      const stories = storiesSnap.size;

      // Get artworks
      const artworksSnap = await getDocs(collection(db, 'artworks'));
      const artworks = artworksSnap.size;

      // Get transactions
      const transactionsSnap = await getDocs(collection(db, 'transactions'));
      const revenue = transactionsSnap.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (data.amount || 0);
      }, 0);

      // Mock growth data (ในระบบจริงจะคำนวณจากข้อมูลจริง)
      const userGrowth = [
        { month: 'ม.ค.', count: 120 },
        { month: 'ก.พ.', count: 180 },
        { month: 'มี.ค.', count: 250 },
        { month: 'เม.ย.', count: 320 },
        { month: 'พ.ค.', count: 410 },
        { month: 'มิ.ย.', count: users.length }
      ];

      const contentGrowth = [
        { month: 'ม.ค.', stories: 50, artworks: 80 },
        { month: 'ก.พ.', stories: 75, artworks: 120 },
        { month: 'มี.ค.', stories: 110, artworks: 180 },
        { month: 'เม.ย.', stories: 150, artworks: 250 },
        { month: 'พ.ค.', stories: 200, artworks: 320 },
        { month: 'มิ.ย.', stories: stories, artworks: artworks }
      ];

      const revenueGrowth = [
        { month: 'ม.ค.', amount: 15000 },
        { month: 'ก.พ.', amount: 22000 },
        { month: 'มี.ค.', amount: 35000 },
        { month: 'เม.ย.', amount: 48000 },
        { month: 'พ.ค.', amount: 62000 },
        { month: 'มิ.ย.', amount: revenue }
      ];

      setStats({
        userGrowth,
        contentGrowth,
        revenueGrowth
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-gray-400">สถิติและการวิเคราะห์ข้อมูล</p>
        </div>

        {/* User Growth */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-bold text-white">การเติบโตของผู้ใช้</h2>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-end gap-2 h-64">
              {stats.userGrowth.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all hover:opacity-80"
                    style={{ 
                      height: `${(data.count / Math.max(...stats.userGrowth.map(d => d.count))) * 100}%`,
                      minHeight: '20px'
                    }}
                  ></div>
                  <p className="text-xs text-gray-400 mt-2">{data.month}</p>
                  <p className="text-xs font-semibold text-white">{data.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Growth */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-white">การเติบโตของเนื้อหา</h2>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-end gap-2 h-64">
              {stats.contentGrowth.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col gap-1">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg"
                      style={{ 
                        height: `${(data.stories / Math.max(...stats.contentGrowth.map(d => d.stories))) * 120}px`,
                        minHeight: '20px'
                      }}
                      title={`นิยาย: ${data.stories}`}
                    ></div>
                    <div 
                      className="w-full bg-gradient-to-t from-pink-600 to-pink-400 rounded-t-lg"
                      style={{ 
                        height: `${(data.artworks / Math.max(...stats.contentGrowth.map(d => d.artworks))) * 120}px`,
                        minHeight: '20px'
                      }}
                      title={`ผลงาน: ${data.artworks}`}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{data.month}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-400">นิยาย</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-pink-500 rounded"></div>
                <span className="text-sm text-gray-400">ผลงานศิลปะ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Growth */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-bold text-white">การเติบโตของรายได้</h2>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-end gap-2 h-64">
              {stats.revenueGrowth.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all hover:opacity-80"
                    style={{ 
                      height: `${(data.amount / Math.max(...stats.revenueGrowth.map(d => d.amount))) * 100}%`,
                      minHeight: '20px'
                    }}
                  ></div>
                  <p className="text-xs text-gray-400 mt-2">{data.month}</p>
                  <p className="text-xs font-semibold text-white">{data.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-400">User Growth Rate</p>
                <p className="text-2xl font-bold text-white">+24%</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">เทียบกับเดือนที่แล้ว</p>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-400">Engagement Rate</p>
                <p className="text-2xl font-bold text-white">68%</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">ผู้ใช้ที่มีการใช้งานสม่ำเสมอ</p>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-400">Revenue Growth</p>
                <p className="text-2xl font-bold text-white">+32%</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">เทียบกับเดือนที่แล้ว</p>
          </div>
        </div>
      </div>
    </div>
  );
}
