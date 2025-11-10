import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEscrow } from '../contexts/EscrowContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { 
  Briefcase, Clock, CheckCircle, XCircle, AlertCircle, 
  Upload, Download, Eye, MessageCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EscrowManagement() {
  const { currentUser } = useAuth();
  const { submitWork, confirmAndRelease, disputeWork, loading } = useEscrow();
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('as_client');
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [workFile, setWorkFile] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadJobs();
    }
  }, [currentUser, activeTab]);

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      let q;
      if (activeTab === 'as_client') {
        q = query(
          collection(db, 'jobs'),
          where('userId', '==', currentUser.uid),
          where('escrowLocked', '==', true),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'jobs'),
          where('acceptedFreelancerId', '==', currentUser.uid),
          where('escrowLocked', '==', true),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const jobsData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const jobData = docSnap.data();
          return {
            id: docSnap.id,
            ...jobData,
            createdAt: jobData.createdAt?.toDate() || new Date()
          };
        })
      );

      setJobs(jobsData);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleSubmitWork = async (jobId) => {
    if (!workFile) {
      alert('กรุณาเลือกไฟล์งาน');
      return;
    }

    // Upload file to Cloudinary or storage
    // For now, using placeholder URL
    const workUrl = 'https://placeholder-work-url.com/work.jpg';

    const result = await submitWork(jobId, currentUser.uid, workUrl);
    if (result.success) {
      alert('ส่งงานสำเร็จ!');
      loadJobs();
      setSelectedJob(null);
      setWorkFile(null);
    } else {
      alert(result.error);
    }
  };

  const handleConfirmWork = async (job) => {
    if (!confirm('ยืนยันว่างานนี้เสร็จสมบูรณ์แล้ว?')) return;

    const result = await confirmAndRelease(
      job.id,
      currentUser.uid,
      job.acceptedFreelancerId
    );

    if (result.success) {
      alert('ยืนยันงานสำเร็จ! คุณสามารถดาวน์โหลดงานได้แล้ว');
      // Download work
      window.open(result.workUrl, '_blank');
      loadJobs();
    } else {
      alert(result.error);
    }
  };

  const handleDispute = async (jobId) => {
    if (!disputeReason.trim()) {
      alert('กรุณาระบุเหตุผลในการร้องเรียน');
      return;
    }

    const result = await disputeWork(jobId, currentUser.uid, disputeReason);
    if (result.success) {
      alert('ส่งคำร้องเรียนสำเร็จ! ทีมงานจะตรวจสอบภายใน 24 ชั่วโมง');
      loadJobs();
      setSelectedJob(null);
      setDisputeReason('');
    } else {
      alert(result.error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      in_progress: { color: 'bg-blue-500/20 text-blue-400', text: 'กำลังทำงาน', icon: Clock },
      submitted: { color: 'bg-yellow-500/20 text-yellow-400', text: 'รอตรวจสอบ', icon: Eye },
      completed: { color: 'bg-green-500/20 text-green-400', text: 'เสร็จสมบูรณ์', icon: CheckCircle },
      disputed: { color: 'bg-red-500/20 text-red-400', text: 'ร้องเรียน', icon: AlertCircle },
      cancelled: { color: 'bg-gray-500/20 text-gray-400', text: 'ยกเลิก', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.in_progress;
    const Icon = config.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
        <Icon size={14} />
        {config.text}
      </span>
    );
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center">
        <p>กรุณาเข้าสู่ระบบ</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            จัดการงาน Escrow
          </h1>
          <p className="text-gray-400">ติดตามและจัดการงานที่มีการฝากเครดิตค้ำประกัน</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-[#2a2a2a]">
          <button
            onClick={() => setActiveTab('as_client')}
            className={`px-6 py-3 font-medium transition border-b-2 ${
              activeTab === 'as_client'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            งานที่ฉันจ้าง
          </button>
          <button
            onClick={() => setActiveTab('as_freelancer')}
            className={`px-6 py-3 font-medium transition border-b-2 ${
              activeTab === 'as_freelancer'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            งานที่ฉันรับ
          </button>
        </div>

        {/* Jobs List */}
        {loadingJobs ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">กำลังโหลด...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400">ไม่มีงานในระบบ Escrow</p>
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
                    <h3 className="text-xl font-bold mb-2">{job.title}</h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{job.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-purple-400 font-bold">
                        {job.escrowAmount} เครดิต
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400">
                        {new Date(job.createdAt).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(job.status)}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4">
                  {activeTab === 'as_freelancer' && job.status === 'in_progress' && (
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition flex items-center gap-2"
                    >
                      <Upload size={16} />
                      ส่งงาน
                    </button>
                  )}

                  {activeTab === 'as_client' && job.status === 'submitted' && (
                    <>
                      <button
                        onClick={() => window.open(job.submittedWorkUrl, '_blank')}
                        className="px-4 py-2 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] transition flex items-center gap-2"
                      >
                        <Eye size={16} />
                        ดูงาน
                      </button>
                      <button
                        onClick={() => handleConfirmWork(job)}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle size={16} />
                        ยืนยันงาน
                      </button>
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition flex items-center gap-2"
                      >
                        <AlertCircle size={16} />
                        ร้องเรียน
                      </button>
                    </>
                  )}

                  {job.status === 'completed' && (
                    <button
                      onClick={() => window.open(job.submittedWorkUrl, '_blank')}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition flex items-center gap-2"
                    >
                      <Download size={16} />
                      ดาวน์โหลดงาน
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submit Work Modal */}
        {selectedJob && activeTab === 'as_freelancer' && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] rounded-2xl max-w-lg w-full p-6 border border-[#2a2a2a]">
              <h2 className="text-2xl font-bold mb-4">ส่งงาน: {selectedJob.title}</h2>
              
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">อัปโหลดไฟล์งาน</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setWorkFile(e.target.files[0])}
                  className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-3 focus:outline-none focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  * ไฟล์ที่อัปโหลดจะมี watermark สำหรับตัวอย่าง
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedJob(null);
                    setWorkFile(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] transition"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleSubmitWork(selectedJob.id)}
                  disabled={!workFile || loading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition disabled:opacity-50"
                >
                  {loading ? 'กำลังส่ง...' : 'ส่งงาน'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dispute Modal */}
        {selectedJob && activeTab === 'as_client' && selectedJob.status === 'submitted' && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] rounded-2xl max-w-lg w-full p-6 border border-[#2a2a2a]">
              <h2 className="text-2xl font-bold mb-4 text-red-400">ร้องเรียนงาน</h2>
              
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">เหตุผลในการร้องเรียน</label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="กรุณาระบุเหตุผลอย่างละเอียด..."
                  className="w-full h-32 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-4 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedJob(null);
                    setDisputeReason('');
                  }}
                  className="flex-1 py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] transition"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleDispute(selectedJob.id)}
                  disabled={!disputeReason.trim() || loading}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
                >
                  {loading ? 'กำลังส่ง...' : 'ส่งคำร้องเรียน'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
