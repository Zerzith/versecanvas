import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCredit } from '../contexts/CreditContext';
import { ArrowLeft, Wallet, DollarSign, AlertCircle, CheckCircle, Clock, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Withdraw() {
  const { currentUser } = useAuth();
  const { credits, deductCredits } = useCredit();
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [withdrawHistory, setWithdrawHistory] = useState([]);

  const CREDIT_TO_BAHT_RATE = 0.5; // 1 เครดิต = 0.5 บาท
  const MIN_WITHDRAW_CREDITS = 100; // ถอนขั้นต่ำ 100 เครดิต
  const MAX_WITHDRAW_CREDITS = 10000; // ถอนสูงสุด 10,000 เครดิต

  useEffect(() => {
    if (currentUser) {
      loadWithdrawHistory();
    }
  }, [currentUser]);

  const loadWithdrawHistory = async () => {
    try {
      const q = query(
        collection(db, 'withdrawals'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWithdrawHistory(history);
    } catch (error) {
      console.error('Error loading withdraw history:', error);
    }
  };

  const calculateBaht = (credits) => {
    return credits * CREDIT_TO_BAHT_RATE;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const creditsToWithdraw = parseInt(amount);

    // Validation
    if (!creditsToWithdraw || creditsToWithdraw < MIN_WITHDRAW_CREDITS) {
      setError(`กรุณากรอกจำนวนเครดิตที่ต้องการถอน (ขั้นต่ำ ${MIN_WITHDRAW_CREDITS} เครดิต)`);
      return;
    }

    if (creditsToWithdraw > MAX_WITHDRAW_CREDITS) {
      setError(`จำนวนเครดิตสูงสุดที่ถอนได้คือ ${MAX_WITHDRAW_CREDITS} เครดิต`);
      return;
    }

    if (creditsToWithdraw > credits) {
      setError('เครดิตของคุณไม่เพียงพอ');
      return;
    }

    if (!bankName || !accountNumber || !accountName) {
      setError('กรุณากรอกข้อมูลบัญชีธนาคารให้ครบถ้วน');
      return;
    }

    setIsLoading(true);

    try {
      // หักเครดิตก่อน
      await deductCredits(
        creditsToWithdraw,
        `ถอนเงิน ${creditsToWithdraw} เครดิต (${calculateBaht(creditsToWithdraw)} บาท)`
      );

      // สร้างคำขอถอนเงิน
      await addDoc(collection(db, 'withdrawals'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || 'ไม่ระบุชื่อ',
        credits: creditsToWithdraw,
        amount: calculateBaht(creditsToWithdraw),
        bankName,
        accountNumber,
        accountName,
        status: 'pending', // pending, approved, rejected, completed
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setSuccess(true);
      setAmount('');
      setBankName('');
      setAccountNumber('');
      setAccountName('');
      
      // Reload history
      setTimeout(() => {
        loadWithdrawHistory();
      }, 1000);

    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      setError('เกิดข้อผิดพลาดในการสร้างคำขอถอนเงิน กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'รอดำเนินการ', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
      approved: { label: 'อนุมัติแล้ว', color: 'bg-blue-500/20 text-blue-400', icon: CheckCircle },
      completed: { label: 'โอนเงินแล้ว', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      rejected: { label: 'ปฏิเสธ', color: 'bg-red-500/20 text-red-400', icon: AlertCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${config.color}`}>
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/credits" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4">
            <ArrowLeft size={20} />
            กลับไปหน้าเครดิต
          </Link>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
            ถอนเงิน
          </h1>
          <p className="text-gray-400">แปลงเครดิตเป็นเงินสดและโอนเข้าบัญชีธนาคารของคุณ</p>
        </div>

        {/* Current Balance */}
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="text-green-400" size={24} />
            <span className="text-gray-400">เครดิตคงเหลือ</span>
          </div>
          <div className="text-4xl font-bold text-green-400">{credits.toLocaleString()}</div>
          <div className="text-gray-400 mt-2">≈ {calculateBaht(credits).toLocaleString()} บาท</div>
        </div>

        {/* Withdraw Form */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">สร้างคำขอถอนเงิน</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-red-400">{error}</div>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
              <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <div className="text-green-400 font-semibold mb-1">สร้างคำขอถอนเงินสำเร็จ!</div>
                <div className="text-gray-400 text-sm">
                  คำขอของคุณอยู่ระหว่างรอการอนุมัติจากแอดมิน เราจะโอนเงินเข้าบัญชีของคุณภายใน 3-5 วันทำการ
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">
                จำนวนเครดิตที่ต้องการถอน *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`ขั้นต่ำ ${MIN_WITHDRAW_CREDITS} เครดิต`}
                className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
                min={MIN_WITHDRAW_CREDITS}
                max={MAX_WITHDRAW_CREDITS}
              />
              {amount && (
                <div className="mt-2 text-sm text-gray-400">
                  ≈ <span className="text-green-400 font-semibold">{calculateBaht(parseInt(amount) || 0).toLocaleString()} บาท</span>
                </div>
              )}
              <div className="mt-2 text-xs text-gray-500">
                อัตราแลกเปลี่ยน: 1 เครดิต = {CREDIT_TO_BAHT_RATE} บาท
              </div>
            </div>

            {/* Bank Info */}
            <div className="border-t border-gray-800 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="text-green-400" size={20} />
                <h3 className="font-semibold">ข้อมูลบัญชีธนาคาร</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">ธนาคาร *</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
                  >
                    <option value="">เลือกธนาคาร</option>
                    <option value="ธนาคารกรุงเทพ">ธนาคารกรุงเทพ</option>
                    <option value="ธนาคารกสิกรไทย">ธนาคารกสิกรไทย</option>
                    <option value="ธนาคารไทยพาณิชย์">ธนาคารไทยพาณิชย์</option>
                    <option value="ธนาคารกรุงไทย">ธนาคารกรุงไทย</option>
                    <option value="ธนาคารทหารไทยธนชาต">ธนาคารทหารไทยธนชาต</option>
                    <option value="ธนาคารกรุงศรีอยุธยา">ธนาคารกรุงศรีอยุธยา</option>
                    <option value="ธนาคารเกียรตินาคินภัทร">ธนาคารเกียรตินาคินภัทร</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">เลขที่บัญชี *</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="xxx-x-xxxxx-x"
                    className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">ชื่อบัญชี *</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="ชื่อ-นามสกุล ตามบัญชีธนาคาร"
                    className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {isLoading ? 'กำลังสร้างคำขอ...' : 'ยืนยันการถอนเงิน'}
            </Button>
          </form>
        </div>

        {/* Withdraw History */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">ประวัติการถอนเงิน</h2>

          {withdrawHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
              <p>ยังไม่มีประวัติการถอนเงิน</p>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawHistory.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="bg-[#0f0f0f] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-lg mb-1">
                        {withdrawal.credits.toLocaleString()} เครดิต
                      </div>
                      <div className="text-green-400 font-semibold">
                        ≈ {withdrawal.amount.toLocaleString()} บาท
                      </div>
                    </div>
                    {getStatusBadge(withdrawal.status)}
                  </div>

                  <div className="space-y-1 text-sm text-gray-400">
                    <div>ธนาคาร: {withdrawal.bankName}</div>
                    <div>เลขที่บัญชี: {withdrawal.accountNumber}</div>
                    <div>ชื่อบัญชี: {withdrawal.accountName}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      {withdrawal.createdAt?.toDate().toLocaleString('th-TH')}
                    </div>
                  </div>

                  {withdrawal.adminNote && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <div className="text-xs text-gray-500 mb-1">หมายเหตุจากแอดมิน:</div>
                      <div className="text-sm text-gray-400">{withdrawal.adminNote}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
