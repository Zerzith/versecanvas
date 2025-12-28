import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  doc, 
  updateDoc, 
  serverTimestamp,
  where,
  addDoc,
  increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building2,
  User,
  Mail,
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import { Button } from '../components/ui/button';

export default function AdminWithdrawals() {
  const { currentUser } = useAuth();
  const [withdrawals, setWithdrawals] = useState([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  useEffect(() => {
    filterWithdrawals();
  }, [withdrawals, filterStatus, searchTerm]);

  const loadWithdrawals = async () => {
    try {
      setIsLoading(true);
      const q = query(
        collection(db, 'withdrawals'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWithdrawals(data);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterWithdrawals = () => {
    let filtered = [...withdrawals];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(w => w.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(w => 
        w.userName?.toLowerCase().includes(term) ||
        w.userEmail?.toLowerCase().includes(term) ||
        w.accountNumber?.includes(term) ||
        w.accountName?.toLowerCase().includes(term)
      );
    }

    setFilteredWithdrawals(filtered);
  };

  const handleApprove = async (withdrawal) => {
    if (!window.confirm('ยืนยันการอนุมัติคำขอถอนเงินนี้?')) return;

    setIsProcessing(true);
    try {
      const withdrawalRef = doc(db, 'withdrawals', withdrawal.id);
      await updateDoc(withdrawalRef, {
        status: 'approved',
        approvedBy: currentUser.uid,
        approvedAt: serverTimestamp(),
        adminNote: adminNote || 'อนุมัติคำขอถอนเงิน',
        updatedAt: serverTimestamp()
      });

      // Create notification for user
      await addDoc(collection(db, 'notifications'), {
        userId: withdrawal.userId,
        type: 'withdrawal_approved',
        title: 'คำขอถอนเงินได้รับการอนุมัติ',
        message: `คำขอถอนเงิน ${withdrawal.credits} เครดิต (${withdrawal.amount} บาท) ได้รับการอนุมัติแล้ว เราจะโอนเงินเข้าบัญชีของคุณภายใน 3-5 วันทำการ`,
        read: false,
        createdAt: serverTimestamp()
      });

      alert('อนุมัติคำขอถอนเงินสำเร็จ');
      setSelectedWithdrawal(null);
      setAdminNote('');
      loadWithdrawals();
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      alert('เกิดข้อผิดพลาดในการอนุมัติคำขอถอนเงิน');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (withdrawal) => {
    const reason = window.prompt('กรุณาระบุเหตุผลในการปฏิเสธ:');
    if (!reason) return;

    setIsProcessing(true);
    try {
      const withdrawalRef = doc(db, 'withdrawals', withdrawal.id);
      await updateDoc(withdrawalRef, {
        status: 'rejected',
        rejectedBy: currentUser.uid,
        rejectedAt: serverTimestamp(),
        adminNote: reason,
        updatedAt: serverTimestamp()
      });

      // Return credits to user
      const userRef = doc(db, 'users', withdrawal.userId);
      await updateDoc(userRef, {
        credits: increment(withdrawal.credits)
      });

      // Create transaction record
      await addDoc(collection(db, 'transactions'), {
        userId: withdrawal.userId,
        type: 'withdrawal_refund',
        amount: withdrawal.credits,
        description: `คืนเครดิตจากคำขอถอนเงินที่ถูกปฏิเสธ: ${reason}`,
        createdAt: serverTimestamp()
      });

      // Create notification
      await addDoc(collection(db, 'notifications'), {
        userId: withdrawal.userId,
        type: 'withdrawal_rejected',
        title: 'คำขอถอนเงินถูกปฏิเสธ',
        message: `คำขอถอนเงิน ${withdrawal.credits} เครดิต ถูกปฏิเสธ เหตุผล: ${reason}. เครดิตของคุณได้รับการคืนแล้ว`,
        read: false,
        createdAt: serverTimestamp()
      });

      alert('ปฏิเสธคำขอถอนเงินสำเร็จ');
      setSelectedWithdrawal(null);
      loadWithdrawals();
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      alert('เกิดข้อผิดพลาดในการปฏิเสธคำขอถอนเงิน');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async (withdrawal) => {
    if (!window.confirm('ยืนยันว่าได้โอนเงินเรียบร้อยแล้ว?')) return;

    setIsProcessing(true);
    try {
      const withdrawalRef = doc(db, 'withdrawals', withdrawal.id);
      await updateDoc(withdrawalRef, {
        status: 'completed',
        completedBy: currentUser.uid,
        completedAt: serverTimestamp(),
        adminNote: adminNote || 'โอนเงินเรียบร้อยแล้ว',
        updatedAt: serverTimestamp()
      });

      // Create notification
      await addDoc(collection(db, 'notifications'), {
        userId: withdrawal.userId,
        type: 'withdrawal_completed',
        title: 'โอนเงินเรียบร้อยแล้ว',
        message: `เราได้โอนเงิน ${withdrawal.amount} บาท เข้าบัญชี ${withdrawal.bankName} ${withdrawal.accountNumber} เรียบร้อยแล้ว`,
        read: false,
        createdAt: serverTimestamp()
      });

      alert('บันทึกการโอนเงินสำเร็จ');
      setSelectedWithdrawal(null);
      setAdminNote('');
      loadWithdrawals();
    } catch (error) {
      console.error('Error completing withdrawal:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกการโอนเงิน');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'รอดำเนินการ', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
      approved: { label: 'อนุมัติแล้ว', color: 'bg-blue-500/20 text-blue-400', icon: CheckCircle },
      completed: { label: 'โอนเงินแล้ว', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      rejected: { label: 'ปฏิเสธ', color: 'bg-red-500/20 text-red-400', icon: XCircle }
    };

    const statusConfig = config[status] || config.pending;
    const Icon = statusConfig.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${statusConfig.color}`}>
        <Icon size={14} />
        {statusConfig.label}
      </span>
    );
  };

  const getStats = () => {
    return {
      total: withdrawals.length,
      pending: withdrawals.filter(w => w.status === 'pending').length,
      approved: withdrawals.filter(w => w.status === 'approved').length,
      completed: withdrawals.filter(w => w.status === 'completed').length,
      rejected: withdrawals.filter(w => w.status === 'rejected').length,
      totalAmount: withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0)
    };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
            จัดการคำขอถอนเงิน
          </h1>
          <p className="text-gray-400">อนุมัติและจัดการคำขอถอนเงินจากผู้ใช้</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">ทั้งหมด</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="text-yellow-400 text-sm mb-1">รอดำเนินการ</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="text-blue-400 text-sm mb-1">อนุมัติแล้ว</div>
            <div className="text-2xl font-bold text-blue-400">{stats.approved}</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="text-green-400 text-sm mb-1">โอนเงินแล้ว</div>
            <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="text-red-400 text-sm mb-1">ปฏิเสธ</div>
            <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหาชื่อ, อีเมล, เลขบัญชี..."
                  className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#0f0f0f] border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
              >
                <option value="all">ทั้งหมด</option>
                <option value="pending">รอดำเนินการ</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="completed">โอนเงินแล้ว</option>
                <option value="rejected">ปฏิเสธ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Withdrawals List */}
        <div className="space-y-4">
          {filteredWithdrawals.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-12 text-center">
              <DollarSign size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-500">ไม่พบคำขอถอนเงิน</p>
            </div>
          ) : (
            filteredWithdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User size={20} className="text-gray-500" />
                      <div>
                        <div className="font-semibold">{withdrawal.userName}</div>
                        <div className="text-sm text-gray-400">{withdrawal.userEmail}</div>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(withdrawal.status)}
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-4">
                  {/* Amount Info */}
                  <div>
                    <h4 className="text-sm text-gray-500 mb-2">จำนวนเงิน</h4>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-green-400">
                        {withdrawal.amount.toLocaleString()} บาท
                      </div>
                      <div className="text-sm text-gray-400">
                        ({withdrawal.credits.toLocaleString()} เครดิต)
                      </div>
                    </div>
                  </div>

                  {/* Bank Info */}
                  <div>
                    <h4 className="text-sm text-gray-500 mb-2">ข้อมูลบัญชี</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-gray-500" />
                        <span>{withdrawal.bankName}</span>
                      </div>
                      <div className="text-gray-400">
                        เลขที่: {withdrawal.accountNumber}
                      </div>
                      <div className="text-gray-400">
                        ชื่อ: {withdrawal.accountName}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Calendar size={16} />
                  <span>สร้างเมื่อ: {withdrawal.createdAt?.toDate().toLocaleString('th-TH')}</span>
                </div>

                {/* Admin Note */}
                {withdrawal.adminNote && (
                  <div className="bg-[#0f0f0f] border border-gray-800 rounded-lg p-3 mb-4">
                    <div className="text-xs text-gray-500 mb-1">หมายเหตุจากแอดมิน:</div>
                    <div className="text-sm text-gray-300">{withdrawal.adminNote}</div>
                  </div>
                )}

                {/* Actions */}
                {withdrawal.status === 'pending' && (
                  <div className="flex gap-2 pt-4 border-t border-gray-800">
                    <Button
                      onClick={() => handleApprove(withdrawal)}
                      disabled={isProcessing}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle size={18} className="mr-2" />
                      อนุมัติ
                    </Button>
                    <Button
                      onClick={() => handleReject(withdrawal)}
                      disabled={isProcessing}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    >
                      <XCircle size={18} className="mr-2" />
                      ปฏิเสธ
                    </Button>
                  </div>
                )}

                {withdrawal.status === 'approved' && (
                  <div className="pt-4 border-t border-gray-800">
                    <Button
                      onClick={() => handleComplete(withdrawal)}
                      disabled={isProcessing}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <CheckCircle size={18} className="mr-2" />
                      ยืนยันโอนเงินเรียบร้อย
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
