import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // Mock data - ในระบบจริงจะดึงจาก collection 'reports'
      const mockReports = [
        {
          id: '1',
          type: 'story',
          contentId: 'story123',
          contentTitle: 'นิยายที่ถูกรายงาน',
          reportedBy: 'user123',
          reporterName: 'ผู้ใช้ A',
          reason: 'เนื้อหาไม่เหมาะสม',
          description: 'มีเนื้อหาที่ไม่เหมาะสมในตอนที่ 5',
          status: 'pending',
          createdAt: new Date()
        },
        {
          id: '2',
          type: 'artwork',
          contentId: 'artwork456',
          contentTitle: 'ผลงานที่ถูกรายงาน',
          reportedBy: 'user456',
          reporterName: 'ผู้ใช้ B',
          reason: 'ละเมิดลิขสิทธิ์',
          description: 'คัดลอกผลงานจากที่อื่น',
          status: 'pending',
          createdAt: new Date(Date.now() - 86400000)
        }
      ];

      setReports(mockReports);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: Clock, color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', label: 'รอตรวจสอบ' },
      approved: { icon: CheckCircle, color: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'อนุมัติ' },
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

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(r => r.status === filter);

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
          <h1 className="text-3xl font-bold text-white mb-2">รายงาน</h1>
          <p className="text-gray-400">ตรวจสอบและจัดการรายงานจากผู้ใช้</p>
        </div>

        {/* Filter */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all' ? 'bg-purple-600 text-white' : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]'
            }`}
          >
            ทั้งหมด ({reports.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'pending' ? 'bg-purple-600 text-white' : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]'
            }`}
          >
            รอตรวจสอบ ({reports.filter(r => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'approved' ? 'bg-purple-600 text-white' : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]'
            }`}
          >
            อนุมัติ ({reports.filter(r => r.status === 'approved').length})
          </button>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <div key={report.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{report.contentTitle}</h3>
                      {getStatusBadge(report.status)}
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      รายงานโดย: <span className="text-gray-300">{report.reporterName}</span>
                    </p>
                    <p className="text-sm text-gray-400">
                      เหตุผล: <span className="text-orange-400">{report.reason}</span>
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {report.createdAt.toLocaleDateString('th-TH')}
                  </span>
                </div>
                
                <p className="text-gray-300 mb-4">{report.description}</p>
                
                {report.status === 'pending' && (
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white text-sm">
                      อนุมัติและลบเนื้อหา
                    </button>
                    <button className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white text-sm">
                      ปฏิเสธรายงาน
                    </button>
                    <button className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-colors text-white text-sm">
                      ดูเนื้อหา
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">ไม่มีรายงาน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
