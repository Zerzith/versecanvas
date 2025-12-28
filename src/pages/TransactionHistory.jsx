import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Coins, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

export default function TransactionHistory() {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ทั้งหมด');

  const filters = ['ทั้งหมด', 'รับเข้า', 'จ่ายออก'];

  useEffect(() => {
    if (currentUser) {
      fetchTransactions();
    }
  }, [currentUser]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', currentUser.uid),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const transactionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'ทั้งหมด') return true;
    if (filter === 'รับเข้า') {
      return transaction.type === 'credit' || transaction.type === 'transfer_in';
    }
    if (filter === 'จ่ายออก') {
      return transaction.type === 'debit' || transaction.type === 'transfer_out';
    }
    return true;
  });

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'credit':
      case 'transfer_in':
        return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
      case 'debit':
      case 'transfer_out':
        return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      default:
        return <Coins className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'credit':
      case 'transfer_in':
        return 'text-green-500';
      case 'debit':
      case 'transfer_out':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getTransactionLabel = (type) => {
    switch (type) {
      case 'credit':
        return 'เติมเครดิต';
      case 'debit':
        return 'หักเครดิต';
      case 'transfer_in':
        return 'รับเครดิต';
      case 'transfer_out':
        return 'โอนเครดิต';
      default:
        return 'ธุรกรรม';
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-24">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
            <Coins className="w-8 h-8 text-purple-500" />
            ประวัติการทำธุรกรรม
          </h1>
          <p className="text-gray-400">ติดตามการเคลื่อนไหวของเครดิตของคุณ</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-8">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-full font-medium transition ${
                filter === f
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">กำลังโหลด...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Coins className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400">ไม่พบประวัติการทำธุรกรรม</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-[#1a1a1a] rounded-xl p-5 border border-[#2a2a2a] hover:border-purple-500 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">
                        {transaction.description || getTransactionLabel(transaction.type)}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {transaction.timestamp.toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'credit' || transaction.type === 'transfer_in' ? '+' : '-'}
                      {transaction.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">เครดิต</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
