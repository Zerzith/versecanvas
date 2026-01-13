import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { DollarSign, Search, Download, Filter, TrendingUp, TrendingDown, Coins } from 'lucide-react';

export default function TransactionManagement() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPurchases: 0,
    totalWithdrawals: 0,
    totalRefunds: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    let filtered = transactions;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.includes(searchTerm) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  }, [searchTerm, filterType, transactions]);

  const fetchTransactions = async () => {
    try {
      const transactionsQuery = query(
        collection(db, 'transactions'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(transactionsQuery);
      
      const transactionsData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          
          // Get user name
          let userName = 'Unknown';
          if (data.userId) {
            try {
              const usersSnap = await getDocs(collection(db, 'users'));
              const user = usersSnap.docs.find(d => d.id === data.userId);
              if (user) {
                userName = user.data().displayName || 'Unknown';
              }
            } catch (error) {
              console.error('Error fetching user:', error);
            }
          }

          return {
            id: docSnap.id,
            ...data,
            userName
          };
        })
      );

      setTransactions(transactionsData);

      // Calculate stats
      const revenue = transactionsData
        .filter(t => t.type === 'purchase' || t.type === 'topup')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const purchases = transactionsData.filter(t => t.type === 'purchase').length;
      const withdrawals = transactionsData.filter(t => t.type === 'withdrawal').length;
      const refunds = transactionsData.filter(t => t.type === 'refund').length;

      setStats({
        totalRevenue: revenue,
        totalPurchases: purchases,
        totalWithdrawals: withdrawals,
        totalRefunds: refunds
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      purchase: 'ซื้อ',
      topup: 'เติมเงิน',
      withdrawal: 'ถอนเงิน',
      refund: 'คืนเงิน',
      reward: 'รางวัล',
      transfer: 'โอน'
    };
    return labels[type] || type;
  };

  const getTypeBadge = (type) => {
    const badges = {
      purchase: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      topup: 'bg-green-500/10 text-green-500 border-green-500/20',
      withdrawal: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      refund: 'bg-red-500/10 text-red-500 border-red-500/20',
      reward: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      transfer: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
    };
    return badges[type] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  const exportToCSV = () => {
    const headers = ['ID', 'วันที่', 'ผู้ใช้', 'ประเภท', 'จำนวน', 'รายละเอียด'];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.createdAt?.toDate().toLocaleString('th-TH') || 'N/A',
      t.userName,
      getTypeLabel(t.type),
      t.amount || 0,
      t.description || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">จัดการธุรกรรม</h1>
              <p className="text-gray-400">ดูและจัดการธุรกรรมทั้งหมด</p>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white"
            >
              <Download size={18} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-500" />
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {stats.totalRevenue.toLocaleString()}
            </p>
            <p className="text-sm text-gray-400">รายได้ทั้งหมด</p>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Coins className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {stats.totalPurchases}
            </p>
            <p className="text-sm text-gray-400">การซื้อทั้งหมด</p>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {stats.totalWithdrawals}
            </p>
            <p className="text-sm text-gray-400">การถอนเงิน</p>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {stats.totalRefunds}
            </p>
            <p className="text-sm text-gray-400">การคืนเงิน</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหาธุรกรรม (ผู้ใช้, ID, รายละเอียด)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-500 appearance-none"
            >
              <option value="all">ทั้งหมด</option>
              <option value="purchase">ซื้อ</option>
              <option value="topup">เติมเงิน</option>
              <option value="withdrawal">ถอนเงิน</option>
              <option value="refund">คืนเงิน</option>
              <option value="reward">รางวัล</option>
              <option value="transfer">โอน</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    วันที่
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    ผู้ใช้
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    ประเภท
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    จำนวน
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    รายละเอียด
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-[#1a1a1a]/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-gray-400">
                        {transaction.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {transaction.createdAt?.toDate().toLocaleString('th-TH') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {transaction.userName}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getTypeBadge(transaction.type)}`}>
                        {getTypeLabel(transaction.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${
                        transaction.type === 'purchase' || transaction.type === 'withdrawal' 
                          ? 'text-red-400' 
                          : 'text-green-400'
                      }`}>
                        {transaction.type === 'purchase' || transaction.type === 'withdrawal' ? '-' : '+'}
                        {transaction.amount?.toLocaleString() || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {transaction.description || 'ไม่มีรายละเอียด'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">ไม่พบธุรกรรม</p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">จำนวนธุรกรรมที่แสดง</p>
              <p className="text-2xl font-bold text-white">{filteredTransactions.length}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm mb-1">จำนวนธุรกรรมทั้งหมด</p>
              <p className="text-2xl font-bold text-white">{transactions.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
