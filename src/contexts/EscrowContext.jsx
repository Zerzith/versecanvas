import { createContext, useContext, useState } from 'react';
import { db } from '../lib/firebase';
import { 
  doc, getDoc, updateDoc, writeBatch, collection, 
  serverTimestamp, increment 
} from 'firebase/firestore';

const EscrowContext = createContext();

export function useEscrow() {
  return useContext(EscrowContext);
}

export function EscrowProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ฟังก์ชันล็อคเครดิต (Escrow Lock)
  const lockEscrow = async (jobId, clientId, amount) => {
    setLoading(true);
    setError(null);

    try {
      const batch = writeBatch(db);

      // 1. ตรวจสอบเครดิตเพียงพอ
      const userRef = doc(db, 'users', clientId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('ไม่พบข้อมูลผู้ใช้');
      }

      const userData = userSnap.data();
      const credits = userData.credits || 0;

      if (credits < amount) {
        throw new Error('เครดิตไม่เพียงพอ');
      }

      // 2. ล็อคเครดิต
      batch.update(userRef, {
        credits: credits - amount,
        lockedCredits: (userData.lockedCredits || 0) + amount,
        updatedAt: serverTimestamp()
      });

      // 3. อัปเดต Job
      const jobRef = doc(db, 'jobs', jobId);
      batch.update(jobRef, {
        escrowAmount: amount,
        escrowLocked: true,
        escrowLockedAt: serverTimestamp(),
        status: 'in_progress',
        updatedAt: serverTimestamp()
      });

      // 4. สร้าง Transaction
      const txnRef = doc(collection(db, 'transactions'));
      batch.set(txnRef, {
        type: 'escrow_lock',
        jobId,
        fromUserId: clientId,
        toUserId: null,
        amount,
        status: 'completed',
        createdAt: serverTimestamp(),
        completedAt: serverTimestamp()
      });

      await batch.commit();

      setLoading(false);
      return { success: true, message: 'ฝากเครดิตสำเร็จ' };

    } catch (err) {
      console.error('Error locking escrow:', err);
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // ฟังก์ชันส่งงาน (Submit Work)
  const submitWork = async (jobId, freelancerId, workUrl) => {
    setLoading(true);
    setError(null);

    try {
      const jobRef = doc(db, 'jobs', jobId);
      const jobSnap = await getDoc(jobRef);

      if (!jobSnap.exists()) {
        throw new Error('ไม่พบงานนี้');
      }

      const job = jobSnap.data();

      if (job.status !== 'in_progress') {
        throw new Error('สถานะงานไม่ถูกต้อง');
      }

      if (!job.escrowLocked) {
        throw new Error('ยังไม่มีการฝากเครดิต');
      }

      await updateDoc(jobRef, {
        status: 'submitted',
        submittedWorkUrl: workUrl,
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setLoading(false);
      return { success: true, message: 'ส่งงานสำเร็จ' };

    } catch (err) {
      console.error('Error submitting work:', err);
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // ฟังก์ชันยืนยันงานและปล่อยเครดิต (Atomic Transaction)
  const confirmAndRelease = async (jobId, clientId, freelancerId) => {
    setLoading(true);
    setError(null);

    try {
      const batch = writeBatch(db);

      // 1. ดึงข้อมูล Job
      const jobRef = doc(db, 'jobs', jobId);
      const jobSnap = await getDoc(jobRef);

      if (!jobSnap.exists()) {
        throw new Error('ไม่พบงานนี้');
      }

      const job = jobSnap.data();

      // ตรวจสอบว่างานถูกส่งแล้ว (รองรับหลายสถานะ)
      const validStatuses = ['submitted', 'review', 'revision_requested'];
      if (!validStatuses.includes(job.status)) {
        throw new Error('งานยังไม่ได้ส่งหรือสถานะไม่ถูกต้อง');
      }

      if (!job.escrowLocked) {
        throw new Error('ไม่มีเครดิตที่ล็อคไว้');
      }

      const amount = job.escrowAmount;
      const workUrl = job.submittedWorkUrl;

      // 2. ปลดล็อคเครดิตจาก Client
      const clientRef = doc(db, 'users', clientId);
      const clientSnap = await getDoc(clientRef);
      const clientData = clientSnap.data();

      batch.update(clientRef, {
        lockedCredits: (clientData.lockedCredits || 0) - amount,
        updatedAt: serverTimestamp()
      });

      // 3. โอนเครดิตให้ Freelancer
      const freelancerRef = doc(db, 'users', freelancerId);
      const freelancerSnap = await getDoc(freelancerRef);
      const freelancerData = freelancerSnap.data();

      batch.update(freelancerRef, {
        credits: (freelancerData.credits || 0) + amount,
        updatedAt: serverTimestamp()
      });

      // 4. อัปเดต Job เป็น completed
      batch.update(jobRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        escrowLocked: false,
        updatedAt: serverTimestamp()
      });

      // 5. สร้าง Transaction
      const txnRef = doc(collection(db, 'transactions'));
      batch.set(txnRef, {
        type: 'escrow_release',
        jobId,
        fromUserId: clientId,
        toUserId: freelancerId,
        amount,
        workUrl,
        status: 'completed',
        createdAt: serverTimestamp(),
        completedAt: serverTimestamp()
      });

      // 6. Commit ทั้งหมดพร้อมกัน (Atomic)
      await batch.commit();

      setLoading(false);
      return { 
        success: true, 
        workUrl, 
        message: 'ยืนยันงานสำเร็จ' 
      };

    } catch (err) {
      console.error('Error confirming work:', err);
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // ฟังก์ชันร้องเรียน (Dispute)
  const disputeWork = async (jobId, clientId, reason) => {
    setLoading(true);
    setError(null);

    try {
      const jobRef = doc(db, 'jobs', jobId);
      const jobSnap = await getDoc(jobRef);

      if (!jobSnap.exists()) {
        throw new Error('ไม่พบงานนี้');
      }

      const job = jobSnap.data();

      if (job.status !== 'submitted') {
        throw new Error('สถานะงานไม่ถูกต้อง');
      }

      await updateDoc(jobRef, {
        status: 'disputed',
        disputeReason: reason,
        disputedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setLoading(false);
      return { success: true, message: 'ส่งคำร้องเรียนสำเร็จ' };

    } catch (err) {
      console.error('Error disputing work:', err);
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // ฟังก์ชันแก้ไขข้อพิพาท (Admin Only)
  const resolveDispute = async (jobId, decision, adminId) => {
    setLoading(true);
    setError(null);

    try {
      const batch = writeBatch(db);

      const jobRef = doc(db, 'jobs', jobId);
      const jobSnap = await getDoc(jobRef);

      if (!jobSnap.exists()) {
        throw new Error('ไม่พบงานนี้');
      }

      const job = jobSnap.data();

      if (job.status !== 'disputed') {
        throw new Error('งานไม่ได้อยู่ในสถานะร้องเรียน');
      }

      const amount = job.escrowAmount;
      const clientId = job.clientId;
      const freelancerId = job.freelancerId;

      if (decision === 'refund_client') {
        // คืนเงินให้ Client
        const clientRef = doc(db, 'users', clientId);
        const clientSnap = await getDoc(clientRef);
        const clientData = clientSnap.data();

        batch.update(clientRef, {
          credits: (clientData.credits || 0) + amount,
          lockedCredits: (clientData.lockedCredits || 0) - amount,
          updatedAt: serverTimestamp()
        });

        batch.update(jobRef, {
          status: 'cancelled',
          disputeResolvedBy: adminId,
          disputeResolvedAt: serverTimestamp(),
          escrowLocked: false,
          updatedAt: serverTimestamp()
        });

        // สร้าง Transaction
        const txnRef = doc(collection(db, 'transactions'));
        batch.set(txnRef, {
          type: 'escrow_refund',
          jobId,
          fromUserId: null,
          toUserId: clientId,
          amount,
          status: 'completed',
          createdAt: serverTimestamp(),
          completedAt: serverTimestamp()
        });

      } else if (decision === 'release_freelancer') {
        // โอนเงินให้ Freelancer
        const clientRef = doc(db, 'users', clientId);
        const clientSnap = await getDoc(clientRef);
        const clientData = clientSnap.data();

        batch.update(clientRef, {
          lockedCredits: (clientData.lockedCredits || 0) - amount,
          updatedAt: serverTimestamp()
        });

        const freelancerRef = doc(db, 'users', freelancerId);
        const freelancerSnap = await getDoc(freelancerRef);
        const freelancerData = freelancerSnap.data();

        batch.update(freelancerRef, {
          credits: (freelancerData.credits || 0) + amount,
          updatedAt: serverTimestamp()
        });

        batch.update(jobRef, {
          status: 'completed',
          disputeResolvedBy: adminId,
          disputeResolvedAt: serverTimestamp(),
          completedAt: serverTimestamp(),
          escrowLocked: false,
          updatedAt: serverTimestamp()
        });

        // สร้าง Transaction
        const txnRef = doc(collection(db, 'transactions'));
        batch.set(txnRef, {
          type: 'escrow_release',
          jobId,
          fromUserId: clientId,
          toUserId: freelancerId,
          amount,
          workUrl: job.submittedWorkUrl,
          status: 'completed',
          createdAt: serverTimestamp(),
          completedAt: serverTimestamp()
        });
      }

      await batch.commit();

      setLoading(false);
      return { success: true, message: 'แก้ไขข้อพิพาทสำเร็จ' };

    } catch (err) {
      console.error('Error resolving dispute:', err);
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  const value = {
    loading,
    error,
    lockEscrow,
    submitWork,
    confirmAndRelease,
    releaseEscrow: confirmAndRelease, // alias สำหรับความเข้ากันได้
    disputeWork,
    resolveDispute
  };

  return (
    <EscrowContext.Provider value={value}>
      {children}
    </EscrowContext.Provider>
  );
}
