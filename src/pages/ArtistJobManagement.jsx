import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Upload, Check, X, Eye, FileImage, AlertCircle, Download, Briefcase, Clock, RefreshCw, MessageCircle } from 'lucide-react';
import { processAndUploadImages } from '../lib/watermark';
import { uploadImage } from '../lib/cloudinary';

export default function ArtistJobManagement() {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [workFile, setWorkFile] = useState(null);
  const [workPreview, setWorkPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState('ทั้งหมด');

  const tabs = ['ทั้งหมด', 'กำลังทำงาน', 'รอแก้ไข', 'รอยืนยัน', 'เสร็จสิ้น'];

  useEffect(() => {
    if (currentUser) {
      fetchMyJobs();
    }
  }, [currentUser]);

  const fetchMyJobs = async () => {
    setLoading(true);
    try {
      // ดึงงานที่ศิลปินได้รับ
      const q = query(
        collection(db, 'jobs'),
        where('acceptedFreelancerId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const jobsData = await Promise.all(
        querySnapshot.docs.map(async (docSnapshot) => {
          const jobData = { id: docSnapshot.id, ...docSnapshot.data() };
          
          // ดึงข้อมูลลูกค้า
          if (jobData.userId) {
            try {
              const clientDoc = await getDoc(doc(db, 'users', jobData.userId));
              if (clientDoc.exists()) {
                jobData.client = clientDoc.data();
              }
            } catch (e) {
              console.log('Could not fetch client:', e);
            }
          }
          
          return jobData;
        })
      );
      
      // เรียงตามวันที่สร้าง
      jobsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      
      setJobs(jobsData);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (selectedTab === 'ทั้งหมด') return true;
    if (selectedTab === 'กำลังทำงาน') return job.status === 'in_progress';
    if (selectedTab === 'รอแก้ไข') return job.status === 'revision_requested';
    if (selectedTab === 'รอยืนยัน') return job.status === 'submitted';
    if (selectedTab === 'เสร็จสิ้น') return job.status === 'completed';
    return true;
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    setWorkFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setWorkPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitWork = async () => {
    if (!workFile || !selectedJob) return;

    setUploading(true);
    try {
      // สร้างภาพพร้อมลายน้ำและอัปโหลดทั้งสองเวอร์ชัน
      const { originalUrl, watermarkedUrl } = await processAndUploadImages(
        workFile,
        'PREVIEW - VerseCanvas'
      );

      // บันทึกข้อมูลงานที่ส่ง
      await addDoc(collection(db, 'workSubmissions'), {
        jobId: selectedJob.id,
        artistId: currentUser.uid,
        clientId: selectedJob.userId,
        originalImageUrl: originalUrl, // เก็บไว้ส่งหลังยืนยัน
        watermarkedImageUrl: watermarkedUrl, // แสดงให้ลูกค้าดู
        status: 'pending', // รอการยืนยัน
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // อัปเดตสถานะงาน
      await updateDoc(doc(db, 'jobs', selectedJob.id), {
        status: 'submitted',
        workSubmitted: true,
        workSubmittedAt: serverTimestamp(),
        watermarkedWorkUrl: watermarkedUrl,
        submittedWorkUrl: originalUrl
      });

      // สร้างการแจ้งเตือนให้ลูกค้า
      await addDoc(collection(db, 'notifications'), {
        userId: selectedJob.userId,
        type: 'work_submitted',
        title: 'ศิลปินส่งงานแล้ว',
        message: `${currentUser.displayName || 'ศิลปิน'} ได้ส่งงาน "${selectedJob.title}" แล้ว กรุณาตรวจสอบและยืนยัน`,
        link: `/job/${selectedJob.id}/review`,
        read: false,
        createdAt: serverTimestamp()
      });

      alert('ส่งงานสำเร็จ! รอลูกค้ายืนยันงาน');
      setShowUploadModal(false);
      setWorkFile(null);
      setWorkPreview('');
      fetchMyJobs();
    } catch (error) {
      console.error('Error submitting work:', error);
      alert('เกิดข้อผิดพลาดในการส่งงาน: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const openUploadModal = (job) => {
    setSelectedJob(job);
    setShowUploadModal(true);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white pt-24">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400 mb-4">กรุณาเข้าสู่ระบบเพื่อดูงานของคุณ</p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 font-medium transition"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
              <Briefcase className="w-8 h-8 text-purple-500" />
              งานของฉัน (ศิลปิน)
            </h1>
            <p className="text-gray-400">จัดการงาน Commission ที่คุณรับ</p>
          </div>
          <button
            onClick={fetchMyJobs}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500 transition"
          >
            <RefreshCw size={16} />
            รีเฟรช
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 overflow-x-auto mb-8 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition ${
                selectedTab === tab
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400">ไม่พบงาน</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] hover:border-purple-500 transition"
              >
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{job.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        job.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                        job.status === 'submitted' ? 'bg-yellow-500/20 text-yellow-400' :
                        job.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        job.status === 'revision_requested' ? 'bg-orange-500/20 text-orange-400' :
                        job.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {job.status === 'in_progress' ? 'กำลังทำงาน' :
                         job.status === 'submitted' ? 'รอการยืนยัน' :
                         job.status === 'completed' ? 'เสร็จสิ้น' :
                         job.status === 'revision_requested' ? 'ขอแก้ไข' :
                         job.status === 'cancelled' ? 'ยกเลิก' :
                         job.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 mb-4 line-clamp-2">{job.description}</p>
                    
                    {/* Client Info */}
                    {job.client && (
                      <div className="flex items-center gap-2 mb-4">
                        <img
                          src={job.client.photoURL || job.client.avatar || '/default-avatar.png'}
                          alt={job.client.displayName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="text-sm text-gray-400">
                          ลูกค้า: {job.client.displayName || 'ไม่ระบุชื่อ'}
                        </span>
                      </div>
                    )}

                    {/* แสดงหมายเหตุการแก้ไข */}
                    {job.status === 'revision_requested' && job.revisionNote && (
                      <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <p className="text-orange-400 text-sm font-medium mb-1 flex items-center gap-2">
                          <AlertCircle size={16} />
                          ลูกค้าขอแก้ไข:
                        </p>
                        <p className="text-gray-300 text-sm">{job.revisionNote}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="text-purple-400 font-semibold">
                        {job.budgetMin} เครดิต
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {job.createdAt?.toDate?.().toLocaleDateString('th-TH') || 'ไม่ระบุ'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[150px]">
                    {/* ปุ่มส่งงาน */}
                    {(job.status === 'in_progress' || job.status === 'revision_requested') && (
                      <button
                        onClick={() => openUploadModal(job)}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 transition"
                      >
                        <Upload size={16} />
                        {job.status === 'revision_requested' ? 'ส่งงานแก้ไข' : 'ส่งงาน'}
                      </button>
                    )}

                    {/* สถานะรอยืนยัน */}
                    {job.status === 'submitted' && (
                      <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-400">
                        <Clock size={16} />
                        รอลูกค้าตรวจสอบ
                      </div>
                    )}

                    {/* สถานะเสร็จสิ้น */}
                    {job.status === 'completed' && (
                      <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 text-green-400">
                        <Check size={16} />
                        เสร็จสิ้น
                      </div>
                    )}

                    {/* สถานะยกเลิก */}
                    {job.status === 'cancelled' && (
                      <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 text-red-400">
                        <X size={16} />
                        ยกเลิก
                      </div>
                    )}

                    {/* ดาวน์โหลดไฟล์งาน */}
                    {job.status === 'completed' && job.originalWorkUrl && (
                      <button
                        onClick={() => window.open(job.originalWorkUrl, '_blank')}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition"
                      >
                        <Download size={16} />
                        ดาวน์โหลดงาน
                      </button>
                    )}

                    <Link
                      to={`/job/${job.id}`}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] transition"
                    >
                      <Eye size={16} />
                      ดูรายละเอียด
                    </Link>

                    <Link
                      to="/messages"
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 transition"
                    >
                      <MessageCircle size={16} />
                      ติดต่อลูกค้า
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] rounded-2xl p-8 max-w-2xl w-full border border-[#2a2a2a]">
              <h2 className="text-2xl font-bold mb-6">
                {selectedJob?.status === 'revision_requested' ? 'ส่งงานแก้ไข' : 'ส่งงาน'}: {selectedJob?.title}
              </h2>

              {/* แสดงหมายเหตุการแก้ไข */}
              {selectedJob?.status === 'revision_requested' && selectedJob?.revisionNote && (
                <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <p className="text-orange-400 text-sm font-medium mb-1">สิ่งที่ลูกค้าต้องการแก้ไข:</p>
                  <p className="text-gray-300 text-sm">{selectedJob.revisionNote}</p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">
                  อัปโหลดงาน <span className="text-red-500">*</span>
                </label>
                
                {workPreview ? (
                  <div className="relative">
                    <img
                      src={workPreview}
                      alt="Preview"
                      className="w-full rounded-lg mb-4"
                    />
                    <button
                      onClick={() => {
                        setWorkFile(null);
                        setWorkPreview('');
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <label className="block w-full p-12 border-2 border-dashed border-[#2a2a2a] rounded-lg hover:border-purple-500 transition cursor-pointer">
                    <div className="text-center">
                      <FileImage className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-300 mb-2">คลิกเพื่อเลือกไฟล์</p>
                      <p className="text-gray-500 text-sm">รองรับ: JPG, PNG, WEBP (สูงสุด 10MB)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                )}

                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-400 text-sm">
                    <strong>หมายเหตุ:</strong> ระบบจะเพิ่มลายน้ำให้อัตโนมัติ ลูกค้าจะเห็นภาพพร้อมลายน้ำก่อน
                    เมื่อลูกค้ายืนยันงานแล้ว ระบบจะส่งไฟล์ต้นฉบับที่ไม่มีลายน้ำให้ลูกค้าโดยอัตโนมัติ
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setWorkFile(null);
                    setWorkPreview('');
                  }}
                  className="flex-1 px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-xl font-medium transition"
                  disabled={uploading}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmitWork}
                  disabled={!workFile || uploading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      กำลังอัปโหลด...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      {selectedJob?.status === 'revision_requested' ? 'ส่งงานแก้ไข' : 'ส่งงาน'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
