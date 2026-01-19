import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Briefcase, Clock, Coins, User, MessageCircle, Share2, Send, ArrowLeft, Users, Eye } from 'lucide-react';
import FollowButton from '../components/FollowButton';
import { useAuth } from '../contexts/AuthContext';
import { useSocial } from '../contexts/SocialContext';
import { useEscrow } from '../contexts/EscrowContext';
import { useCredit } from '../contexts/CreditContext';
import { ref as dbRef, push, set, serverTimestamp } from 'firebase/database';
import { realtimeDb, db } from '../lib/firebase';
import { getDoc, doc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';

const JobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const { lockEscrow, loading: escrowLoading } = useEscrow();
  const { getUserCredits } = useCredit();
  const [job, setJob] = useState(null);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [applicants, setApplicants] = useState([]);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [workSubmitted, setWorkSubmitted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSubmitWork, setShowSubmitWork] = useState(false);
  const [workLink, setWorkLink] = useState('');
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    fetchJobDetail();
    if (currentUser) {
      loadUserCredits();
      checkIfApplied();
      checkWorkSubmission();
      checkAdminStatus();
    }
  }, [jobId, currentUser]);



  const handleShare = () => {
    const shareUrl = window.location.href;
    const shareText = `ดูงาน: ${job?.title} - ${shareUrl}`;
    
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        text: job?.description,
        url: shareUrl
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert('คัดลอกลิงก์สำเร็จ');
    }
  };

  const checkWorkSubmission = async () => {
    if (!currentUser || !jobId) return;
    try {
      const q = query(
        collection(db, 'workSubmissions'),
        where('jobId', '==', jobId)
      );
      const querySnapshot = await getDocs(q);
      // ตรวจสอบว่ามี submission ที่ไม่ใช่ rejected
      const hasValidSubmission = querySnapshot.docs.some(
        doc => doc.data().status !== 'rejected'
      );
      setWorkSubmitted(hasValidSubmission);
    } catch (error) {
      console.error('Error checking work submission:', error);
    }
  };

  const checkAdminStatus = async () => {
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadUserCredits = async () => {
    try {
      const credits = await getUserCredits(currentUser.uid);
      setUserCredits(credits);
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  };

  const fetchJobDetail = async () => {
    setLoading(true);
    try {
      const jobDoc = await getDoc(doc(db, 'jobs', jobId));
      if (jobDoc.exists()) {
        const jobData = { id: jobDoc.id, ...jobDoc.data() };
        setJob(jobData);
        
        // โหลดข้อมูลโปรไฟล์เจ้าของงาน
        if (jobData.userId) {
          const userDoc = await getDoc(doc(db, 'users', jobData.userId));
          if (userDoc.exists()) {
            setOwnerProfile(userDoc.data());
          }
        }
        
        // โหลดรายชื่อผู้สมัครจาก collection jobApplicants
        await loadApplicants(jobId);
      }
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApplicants = async (targetJobId) => {
    try {
      const q = query(
        collection(db, 'jobApplicants'),
        where('jobId', '==', targetJobId)
      );
      const querySnapshot = await getDocs(q);
      
      const applicantsData = await Promise.all(
        querySnapshot.docs.map(async (applicantDoc) => {
          const applicantData = applicantDoc.data();
          const userDoc = await getDoc(doc(db, 'users', applicantData.userId));
          if (userDoc.exists()) {
            return { id: applicantData.userId, ...userDoc.data(), applicantDocId: applicantDoc.id };
          }
          return null;
        })
      );
      setApplicants(applicantsData.filter(a => a !== null));
    } catch (error) {
      console.error('Error loading applicants:', error);
    }
  };

  const checkIfApplied = async () => {
    if (!currentUser || !jobId) return;
    try {
      const q = query(
        collection(db, 'jobApplicants'),
        where('jobId', '==', jobId),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      setHasApplied(!querySnapshot.empty);
    } catch (error) {
      console.error('Error checking application:', error);
    }
  };

  const handleApplyJob = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      // ตรวจสอบว่าเคยสมัครไปหรือยังจาก Firestore collection 'jobApplicants'
      const q = query(
        collection(db, 'jobApplicants'),
        where('jobId', '==', jobId),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        alert('คุณได้สมัครงานนี้แล้ว');
        setHasApplied(true);
        return;
      }

      // บันทึกการสมัครงานลงใน collection 'jobApplicants'
      await addDoc(collection(db, 'jobApplicants'), {
        jobId: jobId,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        userAvatar: currentUser.photoURL || '',
        appliedAt: serverTimestamp(),
        status: 'pending'
      });

      setHasApplied(true);
      alert('สมัครงานสำเร็จ! รอเจ้าของงานติดต่อกลับ');
      fetchJobDetail();
    } catch (error) {
      console.error('Error applying for job:', error);
      alert('เกิดข้อผิดพลาดในการสมัครงาน: ' + error.message);
    }
  };

  const handleSelectArtist = (artist) => {
    setSelectedArtist(artist);
    setShowApplicantsModal(false);
    setShowEscrowModal(true);
  };

  const handlePayEscrow = async () => {
    if (!currentUser || !job || !selectedArtist) return;

    const amount = parseInt(job.budgetMin) || 0;

    if (userCredits < amount) {
      alert(`เครดิตไม่เพียงพอ! คุณมี ${userCredits} เครดิต ต้องการ ${amount} เครดิต`);
      navigate('/credits');
      return;
    }

    if (!confirm(`ยืนยันการฝากเครดิต ${amount} เครดิตให้ ${selectedArtist.displayName}?`)) return;

    const result = await lockEscrow(jobId, selectedArtist.id, amount);

    if (result.success) {
      // อัปเดตงานให้เป็น accepted
      await updateDoc(doc(db, 'jobs', jobId), {
        acceptedFreelancerId: selectedArtist.id,
        status: 'in_progress'
      });

      alert('ฝากเครดิตสำเร็จ! ศิลปินสามารถเริ่มทำงานได้แล้ว');
      setShowEscrowModal(false);
      navigate('/escrow');
    } else {
      alert(result.error);
    }
  };

  const handleSubmitWork = async () => {
    if (!workLink.trim()) {
      alert('กรุณาใส่ลิงก์ส่งงาน');
      return;
    }

    try {
      setSubmitting(true);
      const submissionData = {
        jobId,
        workerId: currentUser.uid,
        workerName: currentUser.displayName || 'Anonymous',
        workLink,
        submittedAt: serverTimestamp(),
        status: 'pending'
      };

      // บันทึกการส่งงานลงใน collection 'workSubmissions'
      await addDoc(collection(db, 'workSubmissions'), submissionData);
      
      // หมายเหตุ: เราไม่อัปเดตสถานะในตาราง 'jobs' โดยตรงที่นี่ 
      // เพราะผู้สมัครไม่มีสิทธิ์แก้ไขเอกสารงานของเจ้าของงาน (Permission Denied)
      // เจ้าของงานจะเป็นผู้กดรับงานและเปลี่ยนสถานะเอง หรือระบบจะเช็คจาก workSubmissions แทน

      alert('ส่งงานสำเร็จ! รอเจ้าของงานตรวจสอบ');
      setWorkLink('');
      setShowSubmitWork(false);
      fetchJobDetail();
      checkWorkSubmission();
    } catch (error) {
      console.error('Error submitting work:', error);
      alert('เกิดข้อผิดพลาดในการส่งงาน: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContactClick = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setShowContactForm(true);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !currentUser) return;

    setSending(true);
    try {
      // Create conversation
      const conversationId = `${currentUser.uid}_${job.userId}_${Date.now()}`;
      
      // Save to user's conversations
      const userConvRef = dbRef(realtimeDb, `conversations/${currentUser.uid}/${conversationId}`);
      await set(userConvRef, {
        userId: job.userId || '',
        userName: job.userName || 'ผู้ใช้',
        userAvatar: job.userAvatar || '',
        lastMessage: message,
        timestamp: serverTimestamp(),
        unread: 0,
        online: false
      });

      // Save to recipient's conversations
      const recipientConvRef = dbRef(realtimeDb, `conversations/${job.userId}/${conversationId}`);
      await set(recipientConvRef, {
        userId: currentUser.uid || '',
        userName: currentUser.displayName || 'ผู้ใช้',
        userAvatar: currentUser.photoURL || '',
        lastMessage: message || '',
        timestamp: serverTimestamp(),
        unread: 1,
        online: true
      });

      // Save message
      const messagesRef = dbRef(realtimeDb, `messages/${conversationId}`);
      await push(messagesRef, {
        senderId: currentUser.uid || '',
        text: `สวัสดีครับ/ค่ะ สนใจงาน "${job.title || 'งาน'}"

${message}`,
        timestamp: serverTimestamp()
      });

      alert('ส่งข้อความเรียบร้อยแล้ว! คุณสามารถดูข้อความในหน้า Messages');
      setShowContactForm(false);
      setMessage('');
      navigate('/messages');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('เกิดข้อผิดพลาดในการส่งข้อความ');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-400">ไม่พบงาน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          to="/artseek"
          className="inline-flex items-center gap-2 mb-6 text-gray-400 hover:text-purple-400 transition"
        >
          <ArrowLeft size={20} />
          กลับไปหน้า Artseek
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={16} />
                      {new Date(job.createdAt).toLocaleDateString('th-TH')}
                    </span>
                    <span>•</span>
                    <span>{applicants.length} ผู้สมัคร</span>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  job.status === 'open' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-[#0f0f0f]0/20 text-gray-400'
                }`}>
                  {job.status === 'open' ? 'เปิดรับ' : 'ปิดรับ'}
                </span>
              </div>

              {/* Job Info */}
              <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-[#2a2a2a]">
                <div>
                  <div className="text-sm text-gray-400 mb-1">งบประมาณ</div>
                  <div className="font-bold text-purple-400">
                    {job.budgetMin} - {job.budgetMax || '∞'} บาท
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">ระยะเวลา</div>
                  <div className="font-bold">{job.duration} วัน</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">ประเภท</div>
                  <div className="font-bold">{job.type}</div>
                </div>
              </div>

              {/* Tags */}
              {job.tags && job.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-xs bg-[#2a2a2a] text-gray-300"
                  >
                    #{tag}
                  </span>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
              <h2 className="text-xl font-bold mb-4">รายละเอียดงาน</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </div>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
                <h2 className="text-xl font-bold mb-4">ความต้องการ</h2>
                <ul className="space-y-3">
                  {job.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    </div>
                    <span className="text-gray-300">{req}</span>
                  </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] sticky top-8">
              {/* Client Info */}
              <h3 className="text-lg font-bold mb-4">ผู้ว่าจ้าง</h3>
              <Link 
                to={`/profile/${job.userId}`}
                className="block hover:opacity-80 transition"
              >
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#2a2a2a]">
                  <div className="relative">
                    <img
                      src={ownerProfile?.photoURL || job.userAvatar || 'https://via.placeholder.com/150'}
                      alt={ownerProfile?.displayName || job.userName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-purple-500"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium hover:text-purple-400 transition">
                      {ownerProfile?.displayName || job.userName}
                    </p>
                    {ownerProfile?.bio && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {ownerProfile.bio}
                      </p>
                    )}
                  </div>
                </div>
              </Link>

              {/* Follow Button */}
              {currentUser && (currentUser.uid !== job.userId || isAdmin) && (
                <div className="mb-6 pb-6 border-b border-[#2a2a2a]">
                  <FollowButton targetUserId={job.userId} />
                </div>
              )}

              {/* Profile Stats */}
              {ownerProfile && (
                <div className="grid grid-cols-3 gap-2 mb-6 pb-6 border-b border-[#2a2a2a]">
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-400">
                      {ownerProfile.followersCount || 0}
                    </div>
                    <div className="text-xs text-gray-400">ผู้ติดตาม</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-pink-400">
                      {ownerProfile.followingCount || 0}
                    </div>
                    <div className="text-xs text-gray-400">กำลังติดตาม</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-400">
                      {ownerProfile.postsCount || 0}
                    </div>
                    <div className="text-xs text-gray-400">ผลงาน</div>
                  </div>
                </div>
              )}

              {/* Apply Button - สำหรับศิลปิน */}
              {currentUser && currentUser.uid !== job.userId && job.status === 'open' && (
                <>
                  <button
                    onClick={handleApplyJob}
                    disabled={hasApplied}
                    className={`w-full py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 mb-3 ${
                      hasApplied 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
                    }`}
                  >
                    {hasApplied ? 'สมัครแล้ว' : 'สมัครงานนี้'}
                  </button>
                  <button
                    onClick={handleContactClick}
                    className="w-full py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] font-medium transition flex items-center justify-center gap-2 mb-3"
                  >
                    <MessageCircle size={18} />
                    ติดต่อผู้ว่าจ้าง
                  </button>
                </>
              )}

              {/* Submit Work Button - สำหรับศิลปินที่ได้รับเลือก */}
              {currentUser && job.acceptedFreelancerId === currentUser.uid && job.status === 'in_progress' && !workSubmitted && (
                <button
                  onClick={() => setShowSubmitWork(true)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 font-medium transition flex items-center justify-center gap-2 mb-3"
                >
                  <Send size={18} />
                  ส่งงาน
                </button>
              )}

              {/* Applicants Button - เฉพาะเจ้าของงาน (ลูกค้า) */}
              {currentUser && (currentUser.uid === job.userId || isAdmin) && job.status === 'open' && (
                <button
                  onClick={() => setShowApplicantsModal(true)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 font-medium transition flex items-center justify-center gap-2 mb-3"
                >
                  <Users size={18} />
                  ดูผู้สมัคร ({applicants.length})
                </button>
              )}

              {/* Review Work Button - เฉพาะเจ้าของงานเมื่อมีงานส่งมา */}
              {currentUser && (currentUser.uid === job.userId || isAdmin) && workSubmitted && (
                <Link
                  to={`/job/${jobId}/review`}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 font-medium transition flex items-center justify-center gap-2 mb-3"
                >
                  <Eye size={18} />
                  ตรวจสอบงาน
                </Link>
              )}

              {!currentUser && (
                <Link
                  to="/login"
                  className="block w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 font-medium transition text-center"
                >
                  เข้าสู่ระบบเพื่อสมัคร
                </Link>
              )}

              {/* Additional Actions */}
              <div className="flex gap-2">
                <button 
                  onClick={handleShare}
                  className="flex-1 py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] transition flex items-center justify-center gap-2"
                  title="แชร์"
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Work Modal */}
      {showSubmitWork && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl max-w-lg w-full p-6 border border-[#2a2a2a]">
            <h2 className="text-2xl font-bold mb-4">ส่งงาน</h2>
            <p className="text-gray-400 mb-6">
              ใส่ลิงก์ผลงานของคุณ (เช่น Google Drive, Dropbox หรือลิงก์รูปภาพ)
            </p>

            <input
              type="url"
              value={workLink}
              onChange={(e) => setWorkLink(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-4 focus:outline-none focus:border-purple-500 mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitWork(false)}
                className="flex-1 py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] transition"
                disabled={submitting}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmitWork}
                disabled={!workLink.trim() || submitting}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? 'กำลังส่ง...' : 'ยืนยันการส่งงาน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escrow Payment Modal */}
      {showEscrowModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl max-w-lg w-full p-6 border border-[#2a2a2a]">
            <h2 className="text-2xl font-bold mb-4">จ่ายเครดิตจ้างงาน</h2>
            <p className="text-gray-400 mb-4 text-sm">
              คุณกำลังจะจ่ายเครดิตเพื่อจ้างศิลปินทำงานนี้
            </p>
            
            <div className="mb-6 space-y-4">
              {selectedArtist && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-4">
                  <h3 className="font-bold text-purple-400 mb-3">ศิลปินที่เลือก</h3>
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedArtist.photoURL || 'https://via.placeholder.com/150'}
                      alt={selectedArtist.displayName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium">{selectedArtist.displayName}</p>
                      <p className="text-sm text-gray-400">{selectedArtist.email}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-[#2a2a2a] rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">งาน:</span>
                  <span className="font-bold">{job.title}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">จำนวนเครดิตที่จ่าย:</span>
                  <span className="text-2xl font-bold text-purple-400">{job.budgetMin} เครดิต</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">เครดิตของคุณ:</span>
                  <span className="font-bold text-green-400">{userCredits} เครดิต</span>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <h3 className="font-bold text-yellow-400 mb-2">ระบบ Escrow คืออะไร?</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• เครดิตของคุณจะถูกล็อคไว้อย่างปลอดภัย</li>
                  <li>• ศิลปินที่รับงานจะส่งงานผ่านระบบ</li>
                  <li>• คุณตรวจสอบและยืนยันงาน</li>
                  <li>• เครดิตจะโอนให้ศิลปินหลังคุณยืนยัน</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEscrowModal(false)}
                className="flex-1 py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] transition"
                disabled={escrowLoading}
              >
                ยกเลิก
              </button>
              <button
                onClick={handlePayEscrow}
                disabled={escrowLoading || userCredits < (parseInt(job.budgetMin) || 0)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition disabled:opacity-50"
              >
                {escrowLoading ? 'กำลังดำเนินการ...' : 'ยืนยันการจ่าย'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Applicants Modal */}
      {showApplicantsModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl max-w-2xl w-full p-6 border border-[#2a2a2a] max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">ผู้สมัครงาน ({applicants.length} คน)</h2>
            
            {applicants.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">ยังไม่มีผู้สมัคร</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applicants.map((applicant) => (
                  <div
                    key={applicant.id}
                    className="bg-[#2a2a2a] rounded-xl p-4 hover:bg-[#3a3a3a] transition"
                  >
                    <div className="flex items-start gap-4">
                      <Link to={`/profile/${applicant.id}`}>
                        <img
                          src={applicant.photoURL || 'https://via.placeholder.com/150'}
                          alt={applicant.displayName}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      </Link>
                      <div className="flex-1">
                        <Link 
                          to={`/profile/${applicant.id}`}
                          className="font-bold text-lg hover:text-purple-400 transition"
                        >
                          {applicant.displayName || 'ไม่ระบุชื่อ'}
                        </Link>
                        {applicant.bio && (
                          <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                            {applicant.bio}
                          </p>
                        )}
                        <div className="flex gap-4 mt-2 text-sm text-gray-400">
                          <span>{applicant.followersCount || 0} ผู้ติดตาม</span>
                          <span>{applicant.postsCount || 0} ผลงาน</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelectArtist(applicant)}
                        className="px-6 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 font-medium transition"
                      >
                        เลือก
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => setShowApplicantsModal(false)}
                className="w-full py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] transition"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl max-w-lg w-full p-6 border border-[#2a2a2a]">
            <h2 className="text-2xl font-bold mb-4">ส่งข้อความถึง {job.userName}</h2>
            <p className="text-gray-400 mb-6">
              แนะนำตัวและบอกเหตุผลที่คุณเหมาะสมกับงานนี้
            </p>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="เขียนข้อความของคุณ..."
              className="w-full h-40 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-4 focus:outline-none focus:border-purple-500 resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowContactForm(false)}
                className="flex-1 py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] transition"
                disabled={sending}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || sending}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    ส่งข้อความ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;
