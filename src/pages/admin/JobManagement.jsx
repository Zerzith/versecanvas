import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Briefcase, Search, Trash2, Eye, EyeOff, Edit, Calendar, Coins, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function JobManagement() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    let filtered = jobs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    setFilteredJobs(filtered);
  }, [searchTerm, statusFilter, jobs]);

  const fetchJobs = async () => {
    try {
      const jobsQuery = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
      const jobsSnap = await getDocs(jobsQuery);
      const jobsData = await Promise.all(
        jobsSnap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          // Get client name
          let clientName = 'Unknown';
          if (data.userId) {
            try {
              const userDoc = await getDocs(query(collection(db, 'users')));
              const user = userDoc.docs.find(d => d.id === data.userId);
              if (user) {
                clientName = user.data().displayName || 'Unknown';
              }
            } catch (error) {
              console.error('Error fetching client:', error);
            }
          }
          return {
            id: docSnap.id,
            ...data,
            clientName
          };
        })
      );
      setJobs(jobsData);
      setFilteredJobs(jobsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!confirm('คุณต้องการลบงานนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้!')) return;

    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      setJobs(jobs.filter(j => j.id !== jobId));
      toast.success('ลบงานสำเร็จ!');
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('เกิดข้อผิดพลาดในการลบ: ' + error.message);
    }
  };

  const handleToggleStatus = async (jobId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'open' ? 'closed' : 'open';
      const docRef = doc(db, 'jobs', jobId);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: new Date()
      });

      setJobs(jobs.map(j => 
        j.id === jobId ? { ...j, status: newStatus } : j
      ));

      toast.success('เปลี่ยนสถานะงานสำเร็จ!');
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20', label: 'เปิดรับ' },
      closed: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', label: 'ปิดรับ' },
      in_progress: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', label: 'กำลังดำเนินการ' },
      completed: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20', label: 'เสร็จสิ้น' }
    };
    const badge = badges[status] || badges.open;
    return (
      <span className={'px-2 py-1 rounded text-xs font-medium border ' + badge.bg + ' ' + badge.text + ' ' + badge.border}>
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">จัดการงาน (Jobs)</h1>
          <p className="text-gray-400">จัดการงาน Commission และ Freelance ทั้งหมดในระบบ</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ค้นหางาน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="open">เปิดรับ</option>
            <option value="closed">ปิดรับ</option>
            <option value="in_progress">กำลังดำเนินการ</option>
            <option value="completed">เสร็จสิ้น</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">ทั้งหมด</p>
            <p className="text-2xl font-bold text-white">{jobs.length}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">เปิดรับ</p>
            <p className="text-2xl font-bold text-green-500">{jobs.filter(j => j.status === 'open').length}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">กำลังดำเนินการ</p>
            <p className="text-2xl font-bold text-blue-500">{jobs.filter(j => j.status === 'in_progress').length}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">เสร็จสิ้น</p>
            <p className="text-2xl font-bold text-purple-500">{jobs.filter(j => j.status === 'completed').length}</p>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    งาน
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    ลูกค้า
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    งบประมาณ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    วันที่สร้าง
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a2a]">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-[#1a1a1a]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{job.title || 'Untitled'}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {job.description || 'No description'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-500" />
                        {job.clientName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      <div className="flex items-center gap-1">
                        <Coins size={16} className="text-yellow-500" />
                        <span className="font-medium">{job.budget?.toLocaleString() || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        {job.createdAt?.toDate().toLocaleDateString('th-TH') || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={'/job/' + job.id}
                          className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors text-blue-400 hover:text-blue-300"
                          title="ดู"
                        >
                          <Eye size={18} />
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(job.id, job.status)}
                          className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors text-yellow-400 hover:text-yellow-300"
                          title={job.status === 'open' ? 'ปิดรับ' : 'เปิดรับ'}
                        >
                          {job.status === 'open' ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors text-red-400 hover:text-red-300"
                          title="ลบ"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">ไม่พบงาน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
