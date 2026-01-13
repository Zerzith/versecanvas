import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { DollarSign, Search, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WithdrawalManagement() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0
  });

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  useEffect(() => {
    let filtered = withdrawals;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(w => w.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(w => 
        w.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.id.includes(searchTerm)
      );
    }

    setFilteredWithdrawals(filtered);
  }, [searchTerm, filterStatus, withdrawals]);

  const fetchWithdrawals = async () => {
    try {
      // Fetch withdrawals from transactions collection
      const withdrawalsQuery = query(
        collection(db, 'transactions'),
        where('type', '==', 'withdrawal'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(withdrawalsQuery);
      
      const withdrawalsData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          
          // Get user info
          let userName = 'Unknown';
          let userEmail = '';
          if (data.userId) {
            try {
              const usersSnap = await getDocs(collection(db, 'users'));
              const user = usersSnap.docs.find(d => d.id === data.userId);
              if (user) {
                userName = user.data().displayName || 'Unknown';
                userEmail = user.data().email || '';
              }
            } catch (error) {
              console.error('Error fetching user:', error);
            }
          }

          return {
            id: docSnap.id,
            ...data,
            userName,
            userEmail,
            status: data.status || 'pending'
          };
        })
      );

      setWithdrawals(withdrawalsData);

      // Calculate stats
      const pending = withdrawalsData.filter(w => w.status === 'pending').length;
      const approved = withdrawalsData.filter(w => w.status === 'approved').length;
      const rejected = withdrawalsData.filter(w => w.status === 'rejected').length;
      const totalAmount = withdrawalsData
        .filter(w => w.status === 'approved')
        .reduce((sum, w) => sum + (w.amount || 0), 0);

      setStats({ pending, approved, rejected, totalAmount });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawalId) => {
    if (!confirm('คุณต้องการอนุมัติการถอนเงินนี้หรือไม่?')) return;

    try {
      const withdrawalRef = doc(db, 'transactions', withdrawalId);
      await updateDoc(withdrawalRef, {
        status: 'approved',
        approvedAt: new Date(),
        updatedAt: new Date()
      });

      // Update local state
      setWithdrawals(withdrawals.map(w => 
        w.id === withdrawalId 
          ? { ...w, status: 'approved' }
          : w
      ));

      toast.success('อนุมัติการถอนเงินสำเร็จ!');
      fetchWithdrawals(); // Refresh stats
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast.error('เกิดข้อผิดพลาดในการอนุมัติ');
    }
  };

  const handleReject = async (withdrawalId) => {
    const reason = prompt('กรุณาระบุเหตุผลในการปฏิเสธ:');
    if (!reason) return;

    try {
      const withdrawalRef = doc(db, 'transactions', withdrawalId);
      await updateDoc(withdrawalRef, {
        status: 'rejected',
        rejectedReason: reason,
        rejectedAt: new Date(),
        updatedAt: new Date()
      });

      // Update local state
      setWithdrawals(withdrawals.map(w => 
        w.id === withdrawalId 
          ? { ...w, status: 'rejected', rejectedReason: reason }
          : w
      ));

      toast.success('ปฏิเสธการถอนเงินสำเร็จ!');
      fetchWithdrawals(); // Refresh stats
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast.error('เกิดข้อผิดพลาดในการปฏิเสธ');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: Clock, color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', label: 'รอดำเนินการ' },
      approved: { icon: CheckCircle, color: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'อนุมัติแล้ว' },
      rejected: { icon: XCircle, color: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'ปฏิเสธ' }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${badge.color}`}>
        <Icon size={14} />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">จัดการการถอนเงิน</h1>
          <p className="text-gray-400">อนุมัติหรือปฏิเสธคำขอถอนเงินจากผู้ใช้</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">รอดำเนินการ</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">อนุมัติแล้ว</p>
                <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">ปฏิเสธ</p>
                <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">ยอดอนุมัติ</p>
                <p className="text-2xl font-bold text-white">฿{stats.totalAmount.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหาผู้ใช้..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'all' ? 'bg-purple-600 text-white' : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]'
              }`}
            >
              ทั้งหมด ({withdrawals.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'pending' ? 'bg-purple-600 text-white' : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]'
              }`}
            >
              รอดำเนินการ ({stats.pending})
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'approved' ? 'bg-purple-600 text-white' : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]'
              }`}
            >
              อนุมัติแล้ว ({stats.approved})
            </button>
          </div>
        </div>

        {/* Withdrawals List */}
        <div className="space-y-4">
          {filteredWithdrawals.length > 0 ? (
            filteredWithdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-[#2a2a2a] rounded-lg">
                      <User className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{withdrawal.userName}</h3>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                      <p className="text-sm text-gray-400 mb-1">{withdrawal.userEmail}</p>
                      <p className="text-sm text-gray-500">ID: {withdrawal.userId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">฿{withdrawal.amount?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {withdrawal.createdAt?.toDate().toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Bank Account Info */}
                {withdrawal.bankAccount && (
                  <div className="bg-[#2a2a2a] rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-gray-400 mb-3">ข้อมูลบัญชีธนาคาร</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">ชื่อบัญชี</p>
                        <p className="text-sm text-white font-medium">{withdrawal.bankAccount.accountName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">เลขบัญชี</p>
                        <p className="text-sm text-white font-medium">{withdrawal.bankAccount.accountNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">ธนาคาร</p>
                        <p className="text-sm text-white font-medium">{withdrawal.bankAccount.bankName || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {withdrawal.description && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">หมายเหตุ</p>
                    <p className="text-gray-300 text-sm">{withdrawal.description}</p>
                  </div>
                )}

                {/* Transaction History */}
                {(withdrawal.status === 'approved' || withdrawal.status === 'rejected') && (
                  <div className="bg-[#2a2a2a] rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-gray-400 mb-3">ประวัติการทำรายการ</h4>
                    <div className="space-y-2">
                      {withdrawal.status === 'approved' && withdrawal.approvedAt && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">วันที่อนุมัติ:</span>
                          <span className="text-green-400">
                            {withdrawal.approvedAt.toDate().toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                      {withdrawal.status === 'approved' && withdrawal.approvedBy && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">ผู้อนุมัติ:</span>
                          <span className="text-white">{withdrawal.approvedBy}</span>
                        </div>
                      )}
                      {withdrawal.status === 'rejected' && withdrawal.rejectedAt && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">วันที่ปฏิเสธ:</span>
                          <span className="text-red-400">
                            {withdrawal.rejectedAt.toDate().toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                      {withdrawal.status === 'rejected' && withdrawal.rejectedBy && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">ผู้ปฏิเสธ:</span>
                          <span className="text-white">{withdrawal.rejectedBy}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {withdrawal.rejectedReason && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-400">
                      <span className="font-semibold">เหตุผลที่ปฏิเสธ:</span> {withdrawal.rejectedReason}
                    </p>
                  </div>
                )}

                {withdrawal.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(withdrawal.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white text-sm font-medium"
                    >
                      <CheckCircle size={16} />
                      อนุมัติ
                    </button>
                    <button
                      onClick={() => handleReject(withdrawal.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white text-sm font-medium"
                    >
                      <XCircle size={16} />
                      ปฏิเสธ
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-12 text-center">
              <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">ไม่มีคำขอถอนเงิน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
