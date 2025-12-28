import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, query, where, getDocs, orderBy, doc, getDoc 
} from 'firebase/firestore';
import { 
  Briefcase, Clock, CheckCircle, XCircle, AlertTriangle,
  Eye, Upload, ThumbsUp, MessageSquare, Calendar, DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function JobManagement() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('client');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('both'); // 'client', 'freelancer', 'both'

  useEffect(() => {
    if (currentUser) {
      loadJobs();
    }
  }, [currentUser, activeTab]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      let jobsList = [];

      if (activeTab === 'client') {
        // งานที่ฉันว่าจ้าง
        const q = query(
          collection(db, 'jobs'),
          where('clientId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        jobsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else {
        // งานที่ฉันรับ
        const q = query(
          collection(db, 'jobs'),
          where('freelancerId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        jobsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      setJobs(jobsList);
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { text: 'เปิดรับ', color: 'bg-green-500/20 text-green-400', icon: Clock },
      in_progress: { text: 'กำลังทำ', color: 'bg-blue-500/20 text-blue-400', icon: Clock },
      submitted: { text: 'รอยืนยัน', color: 'bg-yellow-500/20 text-yellow-400', icon: AlertTriangle },
      completed: { text: 'เสร็จสิ้น', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      disputed: { text: 'ร้องเรียน', color: 'bg-red-500/20 text-red-400', icon: AlertTriangle },
      cancelled: { text: 'ยกเลิก', color: 'bg-gray-500/20 text-gray-400', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.open;
    const Icon = config.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
        <Icon size={14} />
        {config.text}
      </span>
    );
  };

  const getActionButtons = (job) => {
    if (activeTab === 'client') {
      // ปุ่มสำหรับ Client
      if (job.status === 'in_progress' && !job.escrowLocked) {
        return (
          <Link
            to={`/job/${job.id}/escrow`}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-lg text-sm font-medium transition"
          >
            <DollarSign size={16} className="inline mr-1" />
            ฝากเครดิต
          </Link>
        );
      } else if (job.status === 'submitted') {
        return (
          <div className="flex gap-2">
            <Link
              to={`/job/${job.id}/confirm`}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 rounded-lg text-sm font-medium transition"
            >
              <ThumbsUp size={16} className="inline mr-1" />
              ยืนยันรับงาน
            </Link>
            <Link
              to={`/job/${job.id}/dispute`}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition"
            >
              <MessageSquare size={16} className="inline mr-1" />
              ร้องเรียน
            </Link>
          </div>
        );
      } else if (job.status === 'completed') {
        return (
          <Link
            to={`/job/${job.id}/download`}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-medium transition"
          >
            <Eye size={16} className="inline mr-1" />
            ดูงาน
          </Link>
        );
      }
    } else {
      // ปุ่มสำหรับ Freelancer
      if (job.status === 'in_progress' && job.escrowLocked) {
        return (
          <Link
            to={`/job/${job.id}/submit`}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-lg text-sm font-medium transition"
          >
            <Upload size={16} className="inline mr-1" />
            ส่งงาน
          </Link>
        );
      } else if (job.status === 'submitted') {
        return (
          <span className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm">
            รอ Client ยืนยัน...
          </span>
        );
      } else if (job.status === 'completed') {
        return (
          <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm">
            ✓ ได้รับเครดิต: {job.budget}฿
          </span>
        );
      }
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-purple-500" />
            จัดการงาน
          </h1>
          <p className="text-gray-400">ติดตามและจัดการงานของคุณ</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('client')}
            className={`px-6 py-3 rounded-xl font-medium transition ${
              activeTab === 'client'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
            }`}
          >
            งานที่ฉันว่าจ้าง
          </button>
          <button
            onClick={() => setActiveTab('freelancer')}
            className={`px-6 py-3 rounded-xl font-medium transition ${
              activeTab === 'freelancer'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
            }`}
          >
            งานที่ฉันรับ
          </button>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-2xl p-12 text-center border border-[#2a2a2a]">
            <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-4">
              {activeTab === 'client' ? 'คุณยังไม่มีงานที่ว่าจ้าง' : 'คุณยังไม่มีงานที่รับ'}
            </p>
            <Link
              to={activeTab === 'client' ? '/create-job' : '/artseek'}
              className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-xl font-medium transition"
            >
              {activeTab === 'client' ? 'สร้างงานใหม่' : 'หางานใน Artseek'}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] hover:border-purple-500/50 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{job.title}</h3>
                      {getStatusBadge(job.status)}
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                      {job.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <DollarSign size={16} />
                        {job.budget}฿
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={16} />
                        {job.createdAt?.toDate().toLocaleDateString('th-TH')}
                      </span>
                      {job.escrowLocked && (
                        <span className="flex items-center gap-1 text-green-400">
                          🔒 เครดิตล็อคแล้ว
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    {getActionButtons(job)}
                  </div>
                </div>

                {/* Additional Info */}
                {activeTab === 'client' && job.freelancerName && (
                  <div className="pt-4 border-t border-[#2a2a2a]">
                    <p className="text-sm text-gray-400">
                      ผู้รับจ้าง: <span className="text-white">{job.freelancerName}</span>
                    </p>
                  </div>
                )}
                {activeTab === 'freelancer' && job.clientName && (
                  <div className="pt-4 border-t border-[#2a2a2a]">
                    <p className="text-sm text-gray-400">
                      ผู้ว่าจ้าง: <span className="text-white">{job.clientName}</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
