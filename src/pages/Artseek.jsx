import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Search, Plus, Clock, Coins, Users, ChevronRight, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const Artseek = () => {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');

  const categories = ['ทั้งหมด', 'Artsign', 'คอมมิชชั่น', 'งานพิเศษ'];

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      // โหลดข้อมูลงานและโปรไฟล์เจ้าของ
      const jobsData = await Promise.all(
        querySnapshot.docs.map(async (jobDoc) => {
          const jobData = {
            id: jobDoc.id,
            ...jobDoc.data(),
            createdAt: jobDoc.data().createdAt?.toDate() || new Date()
          };
          
          // โหลดข้อมูลโปรไฟล์เจ้าของงาน
          if (jobData.userId) {
            try {
              const userDoc = await getDoc(doc(db, 'users', jobData.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                jobData.ownerProfile = {
                  displayName: userData.displayName || jobData.userName || 'ไม่ระบุชื่อ',
                  photoURL: userData.photoURL || jobData.userAvatar || 'https://via.placeholder.com/150',
                  bio: userData.bio || ''
                };
              }
            } catch (err) {
              console.error('Error fetching user profile:', err);
            }
          }

          // โหลดจำนวนผู้สมัครจาก collection jobApplicants
          try {
            const applicantsQuery = query(
              collection(db, 'jobApplicants'),
              where('jobId', '==', jobData.id)
            );
            const applicantsSnapshot = await getDocs(applicantsQuery);
            jobData.applicantsCount = applicantsSnapshot.size;
          } catch (err) {
            console.error('Error fetching applicants count:', err);
            jobData.applicantsCount = 0;
          }
          
          return jobData;
        })
      );
      
      setJobs(jobsData);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };




  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ทั้งหมด' || job.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
              <Briefcase className="w-8 h-8 text-purple-500" />
              Artseek
            </h1>
            <p className="text-gray-400">ค้นหางานศิลปะและคอมมิชชั่นจากศิลปินทั่วโลก</p>
          </div>

          {currentUser && (
            <Link
              to="/create-job"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 font-medium transition"
            >
              <Plus size={20} />
              ตามหานักวาด
            </Link>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหางาน..."
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

        {/* Jobs Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">กำลังโหลด...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400">ไม่พบงาน</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <Link
                key={job.id}
                to={`/job/${job.id}`}
                className="group bg-[#1a1a1a] rounded-2xl p-6 border-2 border-transparent hover:border-purple-500 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2 group-hover:text-purple-400 transition line-clamp-2">
                      {job.title}
                    </h3>
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">
                      {job.category}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    job.status === 'open' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-[#0f0f0f]0/20 text-gray-400'
                  }`}>
                    {job.status === 'open' ? 'เปิดรับ' : 'ปิดรับ'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {job.description}
                </p>

                {/* Info */}
                <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-[#2a2a2a]">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">งบประมาณ</div>
                    <div className="text-sm font-bold text-purple-400">
                      {job.budgetMin}-{job.budgetMax || '∞'}฿
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">ระยะเวลา</div>
                    <div className="text-sm font-bold">{job.duration} วัน</div>
                  </div>
                </div>

                {/* User and Stats */}
                <div className="flex items-center justify-between">
                  <Link 
                    to={`/profile/${job.userId}`}
                    className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80 transition"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {job.ownerProfile ? (
                      <img
                        src={job.ownerProfile.photoURL}
                        alt={job.ownerProfile.displayName}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-purple-500"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-purple-400" />
                      </div>
                    )}
                    <span className="text-sm text-gray-300 hover:text-purple-400 truncate">
                      {job.ownerProfile?.displayName || job.userName || 'ไม่ระบุชื่อ'}
                    </span>
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-gray-400 flex-shrink-0 ml-2">
                    <Users size={16} />
                    {job.applicantsCount || 0}
                  </div>
                </div>

                {/* View Details */}
                <div className="mt-4 pt-4 border-t border-[#2a2a2a] flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    {new Date(job.createdAt).toLocaleDateString('th-TH')}
                  </span>
                  <span className="text-purple-400 group-hover:text-purple-300 flex items-center gap-1">
                    ดูรายละเอียด
                    <ChevronRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Artseek;
