import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEscrow } from '../contexts/EscrowContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Briefcase, Clock, CheckCircle, XCircle, AlertCircle, 
  Upload, Download, Eye, MessageCircle, Edit, Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { uploadImage } from '../lib/cloudinary';
import { processAndUploadImages } from '../lib/watermark';
import { useNotification } from '../contexts/NotificationContext';

export default function EscrowManagement() {
  const { currentUser } = useAuth();
  const { submitWork, confirmAndRelease, disputeWork, loading } = useEscrow();
  const { createNotification } = useNotification();
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('งานที่จ้าง');
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [workFile, setWorkFile] = useState(null);
  const [workPreview, setWorkPreview] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(null); // 'submit', 'dispute', 'revision'

  useEffect(() => {
    if (currentUser) {
      loadJobs();
    }
  }, [currentUser, activeTab]);

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      let q;
      if (activeTab === 'งานที่จ้าง') {
        // งานที่ฉันเป็นลูกค้า (สั่งงาน)
        q = query(
          collection(db, 'jobs'),
          where('userId', '==', currentUser.uid),
          where('escrowLocked', '==', true),
          orderBy('createdAt', 'desc')
        );
      } else {
        // งานที่ฉันเป็นศิลปิน (รับงาน)
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
          
          // ดึงข้อมูลผู้ใช้อีกฝ่าย
          let otherUserData = null;
          if (activeTab === 'งานที่จ้าง' && jobData.acceptedFreelancerId) {
            const artistDoc = await getDoc(doc(db, 'users', jobData.acceptedFreelancerId));
            if (artistDoc.exists()) {
              otherUserData = { id: artistDoc.id, ...artistDoc.data() };
            }
          } else if (activeTab === 'งานที่รับ' && jobData.userId) {
            const clientDoc = await getDoc(doc(db, 'users', jobData.userId));
            if (clientDoc.exists()) {
              otherUserData = { id: clientDoc.id, ...clientDoc.data() };
            }
          }
          
          return {
            id: docSnap.id,
            ...jobData,
            otherUser: otherUserData,
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
    if (!workFile || !selectedJob) {
      alert('กรุณาเลือกไฟล์งาน');
      return;
    }

    setUploading(true);
    try {
      // สร้างภาพพร้อมลายน้ำและอัปโหลดทั้งสองเวอร์ชัน
      const { originalUrl, watermarkedUrl } = await processAndUploadImages(
        workFile,
        'PREVIEW - VerseCanvas'
      );

      // บันทึกข้อมูลงานที่ส่ง
      const submissionRef = await addDoc(collection(db, 'workSubmissions'), {
        jobId: selectedJob.id,
        artistId: currentUser.uid,
        clientId: selectedJob.userId,
        originalImageUrl: originalUrl,
        watermarkedImageUrl: watermarkedUrl,
        status: 'pending',
        revisionCount: selectedJob.revisionCount || 0,
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // อัปเดตสถานะงาน
      await updateDoc(doc(db, 'jobs', selectedJob.id), {
        status: 'submitted',
        workSubmitted: true,
        workSubmittedAt: serverTimestamp(),
        latestSubmissionId: submissionRef.id,
        watermarkedWorkUrl: watermarkedUrl,
        submittedWorkUrl: originalUrl
      });

      // สร้างการแจ้งเตือนให้ลูกค้า
      await createNotification(selectedJob.userId, 'work_submitted_client', {
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        artistName: currentUser.displayName || 'ศิลปิน',
        artistId: currentUser.uid
      });

      alert('ส่งงานสำเร็จ!');
      loadJobs();
      setShowModal(null);
      setSelectedJob(null);
      setWorkFile(null);
      setWorkPreview('');
    } catch (error) {
      console.error('Error submitting work:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionNote.trim()) {
      alert('กรุณาระบุสิ่งที่ต้องการแก้ไข');
      return;
    }

    try {
      // อัปเดตสถานะงาน
      await updateDoc(doc(db, 'jobs', selectedJob.id), {
        status: 'revision_requested',
        revisionNote: revisionNote,
        revisionCount: (selectedJob.revisionCount || 0) + 1,
        updatedAt: serverTimestamp()
      });

      // สร้างการแจ้งเตือนให้ศิลปิน
      await createNotification(selectedJob.acceptedFreelancerId, 'work_revision_requested', {
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        revisionNote: revisionNote,
        clientName: currentUser.displayName || 'ลูกค้า'
      });

      alert('ส่งคำขอแก้ไขสำเร็จ!');
      loadJobs();
      setShowModal(null);
      setSelectedJob(null);
      setRevisionNote('');
    } catch (error) {
      console.error('Error requesting revision:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handleConfirmWork = async (job) => {
    if (!confirm('ยืนยันว่างานนี้เสร็จสมบูรณ์แล้ว? เครดิตจะถูกโอนให้ศิลปิน')) return;

    try {
      const result = await confirmAndRelease(
        job.id,
        currentUser.uid,
        job.acceptedFreelancerId
      );

      if (result.success) {
        // สร้างการแจ้งเตือนให้ศิลปิน
        await createNotification(job.acceptedFreelancerId, 'work_approved', {
          jobId: job.id,
          jobTitle: job.title,
          amount: job.escrowAmount,
          clientName: currentUser.displayName || 'ลูกค้า'
        });

        alert('ยืนยันงานสำเร็จ! คุณสามารถดาวน์โหลดงานได้แล้ว');
        loadJobs();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error confirming work:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      alert('กรุณาระบุเหตุผลในการร้องเรียน');
      return;
    }

    try {
      const result = await disputeWork(selectedJob.id, currentUser.uid, disputeReason);
      if (result.success) {
        alert('ส่งคำร้องเรียนสำเร็จ! ทีมงานจะตรวจสอบภายใน 24 ชั่วโมง');
        loadJobs();
        setShowModal(null);
        setSelectedJob(null);
        setDisputeReason('');
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error disputing work:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handleCancelJob = async (job) => {
    if (!confirm('ยกเลิกงานนี้? เครดิตจะถูกคืนให้คุณ')) return;

    try {
      await updateDoc(doc(db, 'jobs', job.id), {
        status: 'cancelled',
        escrowLocked: false,
        cancelledAt: serverTimestamp(),
        cancelledBy: currentUser.uid
      });

      // คืนเครดิตให้ลูกค้า (ถ้าเป็นลูกค้าที่ยกเลิก)
      if (activeTab === 'งานที่จ้าง') {
        // Logic คืนเครดิต
      }

      alert('ยกเลิกงานสำเร็จ!');
      loadJobs();
    } catch (error) {
      console.error('Error cancelling job:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      in_progress: { color: 'bg-blue-500/20 text-blue-400', text: 'กำลังทำงาน', icon: Clock },
      submitted: { color: 'bg-yellow-500/20 text-yellow-400', text: 'รอตรวจสอบ', icon: Eye },
      revision_requested: { color: 'bg-orange-500/20 text-orange-400', text: 'ขอแก้ไข', icon: Edit },
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
            onClick={() => setActiveTab('งานที่จ้าง')}
            className={`px-6 py-3 font-medium transition border-b-2 ${
              activeTab === 'งานที่จ้าง'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            งานที่จ้าง
            {jobs.filter(j => activeTab === 'งานที่จ้าง').length > 0 && (
              <span className="ml-2 bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full text-xs">
                {jobs.filter(j => activeTab === 'งานที่จ้าง').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('งานที่รับ')}
            className={`px-6 py-3 font-medium transition border-b-2 ${
              activeTab === 'งานที่รับ'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            งานที่รับ
            {jobs.filter(j => activeTab === 'งานที่รับ').length > 0 && (
              <span className="ml-2 bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full text-xs">
                {jobs.filter(j => activeTab === 'งานที่รับ').length}
              </span>
            )}
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
            <p className="text-gray-400">
              {activeTab === 'งานที่จ้าง' ? 'คุณยังไม่มีงานที่จ้าง' : 'คุณยังไม่มีงานที่รับ'}
            </p>
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
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{job.description}</p>
                    
                    {/* แสดงข้อมูลอีกฝ่าย */}
                    {job.otherUser && (
                      <div className="flex items-center gap-2 mb-3">
                        <img 
                          src={job.otherUser.photoURL || '/default-avatar.png'} 
                          alt={job.otherUser.displayName}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="text-sm text-gray-300">
                            {activeTab === 'งานที่จ้าง' ? 'ศิลปิน: ' : 'ลูกค้า: '}
                            <span className="font-medium">{job.otherUser.displayName || 'ไม่ระบุชื่อ'}</span>
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-purple-400 font-bold">
                        {job.escrowAmount} เครดิต
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400">
                        {new Date(job.createdAt).toLocaleDateString('th-TH')}
                      </span>
                      {job.revisionCount > 0 && (
                        <>
                          <span className="text-gray-500">•</span>
                          <span className="text-orange-400 text-xs">
                            แก้ไข {job.revisionCount} รอบ
                          </span>
                        </>
                      )}
                    </div>
                    
                    {/* แสดงหมายเหตุการแก้ไข */}
                    {job.status === 'revision_requested' && job.revisionNote && (
                      <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <p className="text-xs text-orange-400 mb-1">ขอแก้ไข:</p>
                        <p className="text-sm text-gray-300">{job.revisionNote}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 mt-4">
                  {/* ปุ่มสำหรับศิลปิน (งานที่รับ) */}
                  {activeTab === 'งานที่รับ' && (
                    <>
                      {(job.status === 'in_progress' || job.status === 'revision_requested') && (
                        <button
                          onClick={() => {
                            setSelectedJob(job);
                            setShowModal('submit');
                          }}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition flex items-center gap-2"
                        >
                          <Upload size={16} />
                          {job.status === 'revision_requested' ? 'ส่งงานแก้ไข' : 'ส่งงาน'}
                        </button>
                      )}
                      
                      {job.status === 'completed' && job.submittedWorkUrl && (
                        <button
                          onClick={() => window.open(job.submittedWorkUrl, '_blank')}
                          className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 transition flex items-center gap-2"
                        >
                          <Download size={16} />
                          ดาวน์โหลดงาน
                        </button>
                      )}
                    </>
                  )}

                  {/* ปุ่มสำหรับลูกค้า (งานที่จ้าง) */}
                  {activeTab === 'งานที่จ้าง' && (
                    <>
                      {job.status === 'submitted' && (
                        <>
                          {(job.watermarkedWorkUrl || job.submittedWorkUrl) ? (
                            <button
                              onClick={() => window.open(job.watermarkedWorkUrl || job.submittedWorkUrl, '_blank')}
                              className="px-4 py-2 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] transition flex items-center gap-2"
                            >
                              <Eye size={16} />
                              ดูงาน (มีลายน้ำ)
                            </button>
                          ) : (
                            <Link
                              to={`/job/${job.id}/review`}
                              className="px-4 py-2 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] transition flex items-center gap-2"
                            >
                              <Eye size={16} />
                              ดูงาน
                            </Link>
                          )}
                          <button
                            onClick={() => handleConfirmWork(job)}
                            disabled={loading}
                            className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
                          >
                            <CheckCircle size={16} />
                            ยืนยันงาน
                          </button>
                          <button
                            onClick={() => {
                              setSelectedJob(job);
                              setShowModal('revision');
                            }}
                            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 transition flex items-center gap-2"
                          >
                            <Edit size={16} />
                            ขอแก้ไข
                          </button>
                          <button
                            onClick={() => {
                              setSelectedJob(job);
                              setShowModal('dispute');
                            }}
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
                          ดาวน์โหลดงาน (ไม่มีลายน้ำ)
                        </button>
                      )}

                      {(job.status === 'in_progress' || job.status === 'revision_requested') && (
                        <button
                          onClick={() => handleCancelJob(job)}
                          className="px-4 py-2 rounded-xl bg-gray-600 hover:bg-gray-700 transition flex items-center gap-2"
                        >
                          <XCircle size={16} />
                          ยกเลิกงาน
                        </button>
                      )}
                    </>
                  )}

                  {/* ปุ่มแชท (ทั้งสองฝ่าย) */}
                  {job.otherUser && (
                    <Link
                      to={`/messages?userId=${job.otherUser.id}`}
                      className="px-4 py-2 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] transition flex items-center gap-2"
                    >
                      <MessageCircle size={16} />
                      แชท
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submit Work Modal */}
        {showModal === 'submit' && selectedJob && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] rounded-2xl max-w-lg w-full p-6 border border-[#2a2a2a]">
              <h2 className="text-2xl font-bold mb-4">
                {selectedJob.status === 'revision_requested' ? 'ส่งงานแก้ไข' : 'ส่งงาน'}: {selectedJob.title}
              </h2>
              
              {selectedJob.status === 'revision_requested' && selectedJob.revisionNote && (
                <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <p className="text-xs text-orange-400 mb-1">สิ่งที่ลูกค้าต้องการแก้ไข:</p>
                  <p className="text-sm text-gray-300">{selectedJob.revisionNote}</p>
                </div>
              )}
              
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">อัปโหลดไฟล์งาน</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-3 focus:outline-none focus:border-purple-500"
                />
                {workPreview && (
                  <div className="mt-3">
                    <img src={workPreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  * ไฟล์ที่อัปโหลดจะมี watermark สำหรับตัวอย่าง ไฟล์ต้นฉบับจะส่งหลังลูกค้ายืนยัน
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(null);
                    setSelectedJob(null);
                    setWorkFile(null);
                    setWorkPreview('');
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] transition"
                  disabled={uploading}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmitWork}
                  disabled={!workFile || uploading}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'กำลังอัปโหลด...' : 'ส่งงาน'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Revision Request Modal */}
        {showModal === 'revision' && selectedJob && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] rounded-2xl max-w-lg w-full p-6 border border-[#2a2a2a]">
              <h2 className="text-2xl font-bold mb-4">ขอแก้ไขงาน: {selectedJob.title}</h2>
              
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">สิ่งที่ต้องการแก้ไข</label>
                <textarea
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="ระบุรายละเอียดสิ่งที่ต้องการแก้ไข..."
                  className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-3 focus:outline-none focus:border-purple-500 min-h-[120px]"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(null);
                    setSelectedJob(null);
                    setRevisionNote('');
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] transition"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleRequestRevision}
                  disabled={!revisionNote.trim()}
                  className="flex-1 px-4 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ส่งคำขอแก้ไข
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dispute Modal */}
        {showModal === 'dispute' && selectedJob && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] rounded-2xl max-w-lg w-full p-6 border border-[#2a2a2a]">
              <h2 className="text-2xl font-bold mb-4 text-red-400">ร้องเรียนงาน: {selectedJob.title}</h2>
              
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">เหตุผลในการร้องเรียน</label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="ระบุเหตุผลในการร้องเรียน..."
                  className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-3 focus:outline-none focus:border-red-500 min-h-[120px]"
                />
                <p className="text-xs text-gray-500 mt-2">
                  * ทีมงานจะตรวจสอบภายใน 24 ชั่วโมง
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(null);
                    setSelectedJob(null);
                    setDisputeReason('');
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] transition"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDispute}
                  disabled={!disputeReason.trim()}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ส่งคำร้องเรียน
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
