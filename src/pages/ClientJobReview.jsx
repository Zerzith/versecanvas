import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEscrow } from '../contexts/EscrowContext';
import { useCredit } from '../contexts/CreditContext';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, getDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Check, X, Eye, Download, AlertCircle, RefreshCw, MessageCircle, ArrowLeft, Star, FileText } from 'lucide-react';
import { downloadImage, getFileExtension, generateFilename } from '../lib/download';

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
      // ดึงข้อมูลงาน
      const jobDoc = await getDoc(doc(db, 'jobs', jobId));
      if (jobDoc.exists()) {
        const jobData = { id: jobDoc.id, ...jobDoc.data() };
        setJob(jobData);

        // ดึงข้อมูลศิลปิน
        if (jobData.acceptedFreelancerId) {
          const artistDoc = await getDoc(doc(db, 'users', jobData.acceptedFreelancerId));
          if (artistDoc.exists()) {
            setArtist({ id: artistDoc.id, ...artistDoc.data() });
          }
        }

        // ดึงงานที่ส่งมาล่าสุด
        const q = query(
          collection(db, 'workSubmissions'),
          where('jobId', '==', jobId)
        );
        const querySnapshot = await getDocs(q);
        
        // หา submission ล่าสุดที่ยังไม่ถูก reject
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
    } finally {
      setLoading(false);
    }
  };

  // ยืนยันงาน
  const handleApprove = async () => {
    if (!submission || !job) return;

    if (!confirm('ยืนยันการรับงานนี้? เครดิตจะถูกโอนให้ศิลปินทันที')) return;

    setProcessing(true);
    try {
      // ปล่อยเครดิตจาก escrow ให้ศิลปิน
      const result = await releaseEscrow(jobId, job.acceptedFreelancerId);

      if (!result.success) {
        throw new Error(result.error);
      }

      // อัปเดตสถานะงานที่ส่ง
      await updateDoc(doc(db, 'workSubmissions', submission.id), {
        status: 'approved',
        approvedAt: serverTimestamp()
      });

      // อัปเดตสถานะงาน
      await updateDoc(doc(db, 'jobs', jobId), {
        status: 'completed',
        completedAt: serverTimestamp()
      });

      // บันทึกคำสั่งซื้อ (เพื่อให้ลูกค้าสามารถดาวน์โหลดไฟล์ต้นฉบับได้)
      await addDoc(collection(db, 'orders'), {
        jobId: jobId,
        productTitle: job.title,
        productImage: submission.watermarkedImageUrl,
        productFile: submission.originalImageUrl, // ไฟล์ต้นฉบับ
        productPrice: parseInt(job.budgetMin) || 0,
        productCategory: 'Artseek',
        buyerId: currentUser.uid,
        buyerEmail: currentUser.email,
        sellerId: job.acceptedFreelancerId,
        status: 'เสร็จสิ้น',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // อัปเดตสถิติศิลปิน
      await updateDoc(doc(db, 'users', job.acceptedFreelancerId), {
        completedJobs: increment(1),
        totalEarnings: increment(parseInt(job.budgetMin) || 0)
      });

      // สร้างการแจ้งเตือนให้ศิลปิน
      await addDoc(collection(db, 'notifications'), {
        userId: job.acceptedFreelancerId,
        type: 'work_approved',
        title: 'งานได้รับการยืนยัน',
        message: `ลูกค้ายืนยันงาน "${job.title}" แล้ว คุณได้รับเครดิต ${job.budgetMin} เครดิต`,
        link: '/transactions',
        read: false,
        createdAt: serverTimestamp()
      });

      // รีเฟรชเครดิต
      await refreshCredits();

      // แสดง modal ให้รีวิว
      setShowReviewModal(true);

    } catch (error) {
      console.error('Error approving work:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // ส่งรีวิว
  const handleSubmitReview = async () => {
    try {
      // บันทึกรีวิว
      await addDoc(collection(db, 'reviews'), {
        jobId: jobId,
        artistId: job.acceptedFreelancerId,
        clientId: currentUser.uid,
        rating: rating,
        comment: reviewText,
        createdAt: serverTimestamp()
      });

      // อัปเดต rating เฉลี่ยของศิลปิน
      const artistRef = doc(db, 'users', job.acceptedFreelancerId);
      const artistDoc = await getDoc(artistRef);
      const artistData = artistDoc.data();
      
      const currentRating = artistData.averageRating || 0;
      const totalReviews = artistData.totalReviews || 0;
      const newTotalReviews = totalReviews + 1;
      const newAverageRating = ((currentRating * totalReviews) + rating) / newTotalReviews;

      await updateDoc(artistRef, {
        averageRating: newAverageRating,
        totalReviews: newTotalReviews
      });

      alert('ยืนยันงานและรีวิวสำเร็จ! ไฟล์ต้นฉบับพร้อมดาวน์โหลดในหน้าคำสั่งซื้อ');
      navigate('/orders');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('ยืนยันงานสำเร็จ แต่ไม่สามารถบันทึกรีวิวได้');
      navigate('/orders');
    }
  };

  // ขอแก้ไขงาน
  const handleRequestRevision = async () => {
    if (!revisionNote.trim()) {
      alert('กรุณาระบุสิ่งที่ต้องการให้แก้ไข');
      return;
    }

    setProcessing(true);
    try {
      // อัปเดตสถานะงานที่ส่ง
      await updateDoc(doc(db, 'workSubmissions', submission.id), {
        status: 'revision_requested',
        revisionRequestedAt: serverTimestamp(),
        revisionNote: revisionNote
      });

      // อัปเดตสถานะงาน
      await updateDoc(doc(db, 'jobs', jobId), {
        status: 'revision_requested',
        workSubmitted: false,
        revisionNote: revisionNote,
        revisionRequestedAt: serverTimestamp()
      });

      // สร้างการแจ้งเตือนให้ศิลปิน
      await addDoc(collection(db, 'notifications'), {
        userId: job.acceptedFreelancerId,
        type: 'revision_requested',
        title: 'ลูกค้าขอแก้ไขงาน',
        message: `ลูกค้าขอให้แก้ไขงาน "${job.title}" - ${revisionNote}`,
        link: `/artist-jobs`,
        read: false,
        createdAt: serverTimestamp()
      });

      alert('ส่งคำขอแก้ไขแล้ว ศิลปินจะได้รับการแจ้งเตือน');
      setShowRevisionModal(false);
      setRevisionNote('');
      fetchJobAndSubmission();
    } catch (error) {
      console.error('Error requesting revision:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // ยกเลิกงาน
  const handleCancelJob = async () => {
    if (!cancelReason.trim()) {
      alert('กรุณาระบุเหตุผลในการยกเลิก');
      return;
    }

    if (!confirm('คุณแน่ใจหรือไม่ที่จะยกเลิกงานนี้? การยกเลิกจะต้องรอแอดมินอนุมัติการคืนเครดิต')) return;

    setProcessing(true);
    try {
      // อัปเดตสถานะงาน
      await updateDoc(doc(db, 'jobs', jobId), {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelReason: cancelReason,
        cancelledBy: currentUser.uid
      });

      // สร้างคำขอคืนเงิน (ให้แอดมินอนุมัติ)
      await addDoc(collection(db, 'refundRequests'), {
        jobId: jobId,
        clientId: currentUser.uid,
        artistId: job.acceptedFreelancerId,
        amount: parseInt(job.budgetMin) || 0,
        reason: cancelReason,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // สร้างการแจ้งเตือนให้ศิลปิน
      await addDoc(collection(db, 'notifications'), {
        userId: job.acceptedFreelancerId,
        type: 'job_cancelled',
        title: 'งานถูกยกเลิก',
        message: `ลูกค้ายกเลิกงาน "${job.title}" - เหตุผล: ${cancelReason}`,
        link: `/artist-jobs`,
        read: false,
        createdAt: serverTimestamp()
      });

      // แจ้งเตือนแอดมิน
      await addDoc(collection(db, 'notifications'), {
        userId: 'admin',
        type: 'refund_request',
        title: 'มีคำขอคืนเงิน',
        message: `งาน "${job.title}" ถูกยกเลิก รอการอนุมัติคืนเงิน`,
        link: '/admin/refunds',
        read: false,
        createdAt: serverTimestamp()
      });

      alert('ยกเลิกงานแล้ว คำขอคืนเงินจะถูกส่งให้แอดมินพิจารณา');
      setShowCancelModal(false);
      navigate('/escrow');
    } catch (error) {
      console.error('Error cancelling job:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // ดาวน์โหลดรูปภาพ
  const handleDownload = async (imageUrl, isOriginal = false) => {
    if (!imageUrl) return;

    setDownloading(true);
    try {
      const ext = getFileExtension(imageUrl);
      const filename = generateFilename(
        `${job.title}_${isOriginal ? 'original' : 'preview'}`,
        ext
      );
      await downloadImage(imageUrl, filename);
    } catch (error) {
      console.error('Error downloading:', error);
      // Fallback: เปิดในแท็บใหม่
      window.open(imageUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

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

  if (!job) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white pt-24">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400">ไม่พบงานนี้</p>
            <Link to="/escrow" className="text-purple-400 hover:underline mt-4 inline-block">
              กลับไปหน้าจัดการงาน
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          to="/escrow"
          className="inline-flex items-center gap-2 mb-6 text-gray-400 hover:text-purple-400 transition"
        >
          <ArrowLeft size={20} />
          กลับไปหน้าจัดการงาน
        </Link>

        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 bg-clip-text text-transparent">
          ตรวจสอบงาน
        </h1>

        {/* Job Info */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] mb-6">
          <h2 className="text-2xl font-bold mb-2">{job.title}</h2>
          <p className="text-gray-400 mb-4">{job.description}</p>
          
          {artist && (
            <div className="flex items-center gap-3 mb-4">
              <img
                src={artist.photoURL || artist.avatar || '/default-avatar.png'}
                alt={artist.displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-medium">{artist.displayName || 'ศิลปิน'}</p>
                <p className="text-sm text-gray-400">ศิลปิน</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm">
            <span className="text-purple-400 font-semibold">
              {job.budgetMin} เครดิต
            </span>
            <span className={`px-3 py-1 rounded-full text-xs ${
              job.status === 'review' ? 'bg-yellow-500/20 text-yellow-400' :
              job.status === 'completed' ? 'bg-green-500/20 text-green-400' :
              job.status === 'revision_requested' ? 'bg-orange-500/20 text-orange-400' :
              job.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {job.status === 'review' ? 'รอการยืนยัน' :
               job.status === 'completed' ? 'เสร็จสิ้น' :
               job.status === 'revision_requested' ? 'ขอแก้ไข' :
               job.status === 'cancelled' ? 'ยกเลิก' :
               job.status}
            </span>
          </div>
        </div>

        {/* Work Submission */}
        {submission ? (
          <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#2a2a2a] mb-8">
            <h3 className="text-xl font-bold mb-4">งานที่ส่งมา</h3>

            {/* Preview Image */}
            <div className="mb-6">
              <img
                src={submission.watermarkedImageUrl}
                alt="Work Preview"
                className="w-full rounded-lg cursor-pointer"
                onClick={() => window.open(submission.watermarkedImageUrl, '_blank')}
              />
              <p className="text-sm text-gray-400 mt-2 text-center">
                * ภาพนี้มีลายน้ำ เมื่อยืนยันงานแล้วจะได้ไฟล์ต้นฉบับที่ไม่มีลายน้ำ
              </p>
            </div>

            {/* Download Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => handleDownload(submission.watermarkedImageUrl, false)}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] transition disabled:opacity-50"
              >
                <Eye size={16} />
                ดูภาพตัวอย่าง
              </button>

              {job.status === 'completed' && submission.originalImageUrl && (
                <button
                  onClick={() => handleDownload(submission.originalImageUrl, true)}
                  disabled={downloading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 transition disabled:opacity-50"
                >
                  <Download size={16} />
                  ดาวน์โหลดไฟล์ต้นฉบับ
                </button>
              )}
            </div>

            {/* Warning */}
            {job.status === 'review' && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                <p className="text-yellow-400 text-sm">
                  <strong>คำเตือน:</strong> เมื่อยืนยันงานแล้ว เครดิตจะถูกโอนให้ศิลปินทันที
                  และคุณจะได้รับไฟล์ต้นฉบับที่ไม่มีลายน้ำในหน้าคำสั่งซื้อ
                </p>
              </div>
            )}

            {/* Action Buttons */}
            {job.status === 'review' && (
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setShowCancelModal(true)}
                  disabled={processing}
                  className="flex-1 min-w-[150px] px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <X size={20} />
                  ยกเลิกงาน
                </button>
                <button
                  onClick={() => setShowRevisionModal(true)}
                  disabled={processing}
                  className="flex-1 min-w-[150px] px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} />
                  ขอแก้ไข
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex-1 min-w-[150px] px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      กำลังดำเนินการ...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      ยืนยันงาน
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Completed Status */}
            {job.status === 'completed' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-400 text-sm flex items-center gap-2">
                  <Check size={16} />
                  งานเสร็จสมบูรณ์แล้ว - คุณสามารถดาวน์โหลดไฟล์ต้นฉบับได้
                </p>
              </div>
            )}

            {/* Revision Requested Status */}
            {job.status === 'revision_requested' && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <p className="text-orange-400 text-sm flex items-center gap-2">
                  <RefreshCw size={16} />
                  รอศิลปินแก้ไขงาน
                </p>
                {job.revisionNote && (
                  <p className="text-gray-300 text-sm mt-2">
                    หมายเหตุ: {job.revisionNote}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#2a2a2a] mb-8">
            <div className="text-center py-8">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400">ยังไม่มีงานที่ส่งมา</p>
              <p className="text-sm text-gray-500 mt-2">รอศิลปินส่งงาน</p>
            </div>
          </div>
        )}

        {/* Contact Artist */}
        {artist && (
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <h3 className="text-lg font-bold mb-4">ติดต่อศิลปิน</h3>
            <Link
              to="/messages"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 transition w-fit"
            >
              <MessageCircle size={16} />
              ส่งข้อความ
            </Link>
          </div>
        )}
      </div>

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-8 max-w-md w-full border border-[#2a2a2a]">
            <h2 className="text-2xl font-bold mb-4">ขอแก้ไขงาน</h2>
            <p className="text-gray-400 mb-4">กรุณาระบุสิ่งที่ต้องการให้ศิลปินแก้ไข</p>
            
            <textarea
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="เช่น ขอให้ปรับสีให้สว่างขึ้น, เพิ่มรายละเอียดที่..."
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-4 mb-4 min-h-[120px] focus:outline-none focus:border-purple-500"
            />

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowRevisionModal(false);
                  setRevisionNote('');
                }}
                className="flex-1 px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-xl font-medium transition"
                disabled={processing}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleRequestRevision}
                disabled={processing || !revisionNote.trim()}
                className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded-xl font-medium transition disabled:opacity-50"
              >
                {processing ? 'กำลังส่ง...' : 'ส่งคำขอแก้ไข'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-8 max-w-md w-full border border-[#2a2a2a]">
            <h2 className="text-2xl font-bold mb-4 text-red-500">ยกเลิกงาน</h2>
            <p className="text-gray-400 mb-4">
              การยกเลิกงานจะต้องรอแอดมินพิจารณาคืนเครดิต กรุณาระบุเหตุผล
            </p>
            
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="เหตุผลในการยกเลิก..."
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-4 mb-4 min-h-[120px] focus:outline-none focus:border-red-500"
            />

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="flex-1 px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-xl font-medium transition"
                disabled={processing}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCancelJob}
                disabled={processing || !cancelReason.trim()}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-medium transition disabled:opacity-50"
              >
                {processing ? 'กำลังดำเนินการ...' : 'ยืนยันยกเลิก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-8 max-w-md w-full border border-[#2a2a2a]">
            <h2 className="text-2xl font-bold mb-4">รีวิวศิลปิน</h2>
            <p className="text-gray-400 mb-4">ให้คะแนนและรีวิวการทำงานของศิลปิน</p>
            
            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="เขียนรีวิว (ไม่บังคับ)..."
              className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-4 mb-4 min-h-[100px] focus:outline-none focus:border-purple-500"
            />

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  navigate('/orders');
                }}
                className="flex-1 px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-xl font-medium transition"
              >
                ข้าม
              </button>
              <button
                onClick={handleSubmitReview}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 rounded-xl font-medium transition"
              >
                ส่งรีวิว
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
