import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEscrow } from '../contexts/EscrowContext';
import { useCredit } from '../contexts/CreditContext';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, getDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Check, X, Eye, Download, AlertCircle, RefreshCw, MessageCircle, ArrowLeft, Star, FileText, ShieldCheck, RefreshCcw, CheckCircle2, Clock } from 'lucide-react';
import { downloadImage, getFileExtension, generateFilename } from '../lib/download';
import { Button } from '../components/ui/button';
import { toast } from 'react-hot-toast';

export default function ClientJobReview() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { releaseEscrow } = useEscrow();
  const { refreshCredits } = useCredit();
  const [job, setJob] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (currentUser && jobId) {
      fetchJobAndSubmission();
    }
  }, [currentUser, jobId]);

  const fetchJobAndSubmission = async () => {
    setLoading(true);
    try {
      const jobDoc = await getDoc(doc(db, 'jobs', jobId));
      if (jobDoc.exists()) {
        const jobData = { id: jobDoc.id, ...jobDoc.data() };
        // ตรวจสอบว่าเป็นเจ้าของงานหรือไม่ (ใช้ userId แทน clientId)
        if (jobData.userId !== currentUser.uid && jobData.clientId !== currentUser.uid) {
          toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
          navigate('/');
          return;
        }
        setJob(jobData);

        if (jobData.acceptedFreelancerId) {
          const artistDoc = await getDoc(doc(db, 'users', jobData.acceptedFreelancerId));
          if (artistDoc.exists()) {
            setArtist({ id: artistDoc.id, ...artistDoc.data() });
          }
        }

        const q = query(
          collection(db, 'workSubmissions'),
          where('jobId', '==', jobId)
        );
        const querySnapshot = await getDocs(q);
        
        const submissions = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(s => s.status !== 'rejected')
          .sort((a, b) => {
            const dateA = a.submittedAt?.toDate?.() || new Date(0);
            const dateB = b.submittedAt?.toDate?.() || new Date(0);
            return dateB - dateA;
          });

        if (submissions.length > 0) {
          setSubmission(submissions[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!submission || !job) return;
    if (!window.confirm('ยืนยันการรับงานนี้? เครดิตจะถูกโอนให้ศิลปินทันที')) return;

    setProcessing(true);
    try {
      const result = await releaseEscrow(jobId, currentUser.uid, job.acceptedFreelancerId);
      if (!result.success) throw new Error(result.error);

      await updateDoc(doc(db, 'workSubmissions', submission.id), {
        status: 'approved',
        approvedAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'jobs', jobId), {
        status: 'completed',
        completedAt: serverTimestamp()
      });

      await addDoc(collection(db, 'orders'), {
        jobId: jobId,
        productTitle: job.title,
        productImage: submission.watermarkedImageUrl,
        productFile: submission.originalImageUrl,
        productPrice: parseInt(job.budgetMin) || 0,
        productCategory: 'Artseek',
        buyerId: currentUser.uid,
        buyerEmail: currentUser.email,
        sellerId: job.acceptedFreelancerId,
        status: 'เสร็จสิ้น',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'users', job.acceptedFreelancerId), {
        completedJobs: increment(1),
        totalEarnings: increment(parseInt(job.budgetMin) || 0)
      });

      await addDoc(collection(db, 'notifications'), {
        userId: job.acceptedFreelancerId,
        type: 'work_approved',
        title: 'งานได้รับการยืนยัน',
        message: `ลูกค้ายืนยันงาน "${job.title}" แล้ว คุณได้รับเครดิต ${job.budgetMin} เครดิต`,
        link: '/transactions',
        read: false,
        createdAt: serverTimestamp()
      });

      await refreshCredits();
      setShowReviewModal(true);
      toast.success('ยืนยันรับงานสำเร็จ!');
    } catch (error) {
      console.error('Error approving work:', error);
      toast.error('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionNote.trim()) {
      toast.error('กรุณาระบุสิ่งที่ต้องการให้แก้ไข');
      return;
    }

    setProcessing(true);
    try {
      await updateDoc(doc(db, 'workSubmissions', submission.id), {
        status: 'revision_requested',
        revisionRequestedAt: serverTimestamp(),
        revisionNote: revisionNote
      });

      await updateDoc(doc(db, 'jobs', jobId), {
        status: 'revision_requested',
        workSubmitted: false,
        revisionNote: revisionNote,
        revisionRequestedAt: serverTimestamp()
      });

      await addDoc(collection(db, 'notifications'), {
        userId: job.acceptedFreelancerId,
        type: 'revision_requested',
        title: 'ลูกค้าขอแก้ไขงาน',
        message: `ลูกค้าขอให้แก้ไขงาน "${job.title}" - ${revisionNote}`,
        link: `/artist-jobs`,
        read: false,
        createdAt: serverTimestamp()
      });

      toast.success('ส่งคำขอแก้ไขแล้ว ศิลปินจะได้รับการแจ้งเตือน');
      setShowRevisionModal(false);
      setRevisionNote('');
      fetchJobAndSubmission();
    } catch (error) {
      console.error('Error requesting revision:', error);
      toast.error('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelJob = async () => {
    if (!cancelReason.trim()) {
      toast.error('กรุณาระบุเหตุผลในการยกเลิก');
      return;
    }

    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะยกเลิกงานนี้? การยกเลิกจะต้องรอแอดมินอนุมัติการคืนเครดิต')) return;

    setProcessing(true);
    try {
      await updateDoc(doc(db, 'jobs', jobId), {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelReason: cancelReason,
        cancelledBy: currentUser.uid
      });

      await addDoc(collection(db, 'refundRequests'), {
        jobId: jobId,
        clientId: currentUser.uid,
        artistId: job.acceptedFreelancerId,
        amount: parseInt(job.budgetMin) || 0,
        reason: cancelReason,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, 'notifications'), {
        userId: job.acceptedFreelancerId,
        type: 'job_cancelled',
        title: 'งานถูกยกเลิก',
        message: `ลูกค้ายกเลิกงาน "${job.title}" - เหตุผล: ${cancelReason}`,
        link: `/artist-jobs`,
        read: false,
        createdAt: serverTimestamp()
      });

      toast.success('ยกเลิกงานแล้ว คำขอคืนเงินจะถูกส่งให้แอดมินพิจารณา');
      setShowCancelModal(false);
      navigate('/orders');
    } catch (error) {
      console.error('Error cancelling job:', error);
      toast.error('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async (imageUrl, isOriginal = false) => {
    if (!imageUrl) return;
    setDownloading(true);
    try {
      const ext = getFileExtension(imageUrl);
      const filename = generateFilename(`${job.title}_${isOriginal ? 'original' : 'preview'}`, ext);
      await downloadImage(imageUrl, filename);
    } catch (error) {
      window.open(imageUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white pt-24 flex flex-col items-center justify-center">
        <AlertCircle size={64} className="text-gray-500 mb-4" />
        <p className="text-xl text-gray-400">ไม่พบข้อมูลงาน</p>
        <Link to="/orders" className="mt-4 text-purple-400 hover:underline">กลับไปหน้าคำสั่งซื้อ</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition">
          <ArrowLeft size={20} />
          <span>กลับ</span>
        </button>

        <div className="bg-[#1a1a1a] rounded-3xl border border-[#2a2a2a] overflow-hidden">
          <div className="p-8 border-b border-[#2a2a2a] bg-gradient-to-r from-purple-900/10 to-transparent">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                <p className="text-gray-400">รหัสงาน: {job.id}</p>
              </div>
              <div className="px-4 py-2 bg-purple-500/10 text-purple-400 rounded-full text-sm font-bold border border-purple-500/20">
                {job.status === 'submitted' || job.status === 'review' || job.status === 'revision_requested' ? 'รอการยืนยัน' : job.status === 'completed' ? 'เสร็จสิ้น' : 'ยกเลิก'}
              </div>
            </div>
            {artist && (
              <div className="flex items-center gap-3">
                <img src={artist.photoURL || '/default-avatar.png'} className="w-10 h-10 rounded-full object-cover" alt="" />
                <div>
                  <p className="font-medium">{artist.displayName}</p>
                  <p className="text-xs text-gray-400">ศิลปิน</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-8 space-y-8">
            {submission ? (
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Check size={24} className="text-green-500" />
                  ผลงานที่ส่งมอบ
                </h3>
                <div className="bg-black/40 rounded-2xl p-6 border border-[#2a2a2a]">
                  <img src={submission.watermarkedImageUrl} alt="Preview" className="w-full rounded-xl border border-[#333] mb-4" />
                  <p className="text-sm text-gray-400 text-center mb-6">* ภาพนี้มีลายน้ำ เมื่อยืนยันงานแล้วจะได้ไฟล์ต้นฉบับ</p>
                  
                  <div className="flex justify-center gap-4">
                    <Button onClick={() => handleDownload(submission.watermarkedImageUrl)} className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white px-6 py-2 rounded-full flex items-center gap-2">
                      <Eye size={18} /> ดูภาพตัวอย่าง
                    </Button>
                    {job.status === 'completed' && submission.originalImageUrl && (
                      <Button onClick={() => handleDownload(submission.originalImageUrl, true)} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full flex items-center gap-2">
                        <Download size={18} /> ดาวน์โหลดไฟล์จริง
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-black/20 rounded-2xl border border-dashed border-[#333]">
                <Clock size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-500">ยังไม่มีการส่งมอบงาน</p>
              </div>
            )}

            {(job.status === 'submitted' || job.status === 'review' || job.status === 'revision_requested') && submission && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <Button onClick={handleApprove} disabled={processing} className="bg-green-600 hover:bg-green-700 text-white py-8 rounded-2xl text-lg font-bold flex items-center justify-center gap-3">
                  {processing ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><ShieldCheck size={24} /> ยืนยันรับงาน</>}
                </Button>
                <Button onClick={() => setShowRevisionModal(true)} disabled={processing} className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white py-8 rounded-2xl text-lg font-bold flex items-center justify-center gap-3">
                  <RefreshCcw size={24} /> ขอแก้ไขงาน
                </Button>
              </div>
            )}

            {showRevisionModal && (
              <div className="bg-purple-500/5 rounded-2xl p-6 border border-purple-500/20">
                <h4 className="text-lg font-bold mb-4">รายละเอียดที่ต้องการให้แก้ไข</h4>
                <textarea value={revisionNote} onChange={(e) => setRevisionNote(e.target.value)} placeholder="ระบุสิ่งที่ต้องการให้ปรับปรุง..." className="w-full bg-black/40 border border-[#333] rounded-xl p-4 text-white focus:border-purple-500 outline-none min-h-[120px] mb-4" />
                <div className="flex gap-3">
                  <Button onClick={handleRequestRevision} disabled={processing} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl">ส่งคำขอแก้ไข</Button>
                  <Button onClick={() => setShowRevisionModal(false)} className="px-6 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white font-bold py-3 rounded-xl">ยกเลิก</Button>
                </div>
              </div>
            )}

            <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20 flex items-start gap-3">
              <AlertCircle className="text-blue-400 shrink-0" size={20} />
              <p className="text-sm text-blue-200/80">
                หากคุณยืนยันรับงาน ระบบจะโอนเครดิตจำนวน <strong>{job.budgetMin} เครดิต</strong> ให้กับศิลปินทันที
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
