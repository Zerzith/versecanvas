import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Search, Edit, Trash2, Ban, CheckCircle, Shield, User, Mail, 
  Calendar, Coins, MoreVertical, X
} from 'lucide-react';
import UserAvatar from '../../components/UserAvatar';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    email: '',
    role: 'user',
    banned: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user => 
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.includes(searchTerm)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      setFilteredUsers(usersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      displayName: user.displayName || '',
      email: user.email || '',
      role: user.role || 'user',
      banned: user.banned || false
    });
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        displayName: editForm.displayName,
        role: editForm.role,
        banned: editForm.banned,
        updatedAt: new Date()
      });

      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, ...editForm, updatedAt: new Date() }
          : u
      ));

      setShowEditModal(false);
      setSelectedUser(null);
      alert('บันทึกข้อมูลสำเร็จ!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleBanUser = async (userId, currentBanStatus) => {
    if (!confirm(`คุณต้องการ${currentBanStatus ? 'ปลดแบน' : 'แบน'}ผู้ใช้นี้หรือไม่?`)) return;

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        banned: !currentBanStatus,
        updatedAt: new Date()
      });

      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, banned: !currentBanStatus }
          : u
      ));

      alert(`${currentBanStatus ? 'ปลดแบน' : 'แบน'}ผู้ใช้สำเร็จ!`);
    } catch (error) {
      console.error('Error banning user:', error);
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('คุณต้องการลบผู้ใช้นี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้!')) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(u => u.id !== userId));
      alert('ลบผู้ใช้สำเร็จ!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { color: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Admin' },
      moderator: { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', label: 'Moderator' },
      user: { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', label: 'User' }
    };
    const badge = badges[role] || badges.user;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${badge.color}`}>
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
          <h1 className="text-3xl font-bold text-white mb-2">จัดการผู้ใช้</h1>
          <p className="text-gray-400">จัดการผู้ใช้ทั้งหมดในระบบ</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหาผู้ใช้ (ชื่อ, อีเมล, ID)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">ผู้ใช้ทั้งหมด</p>
            <p className="text-2xl font-bold text-white">{users.length}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Admin</p>
            <p className="text-2xl font-bold text-red-500">{users.filter(u => u.role === 'admin').length}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Moderator</p>
            <p className="text-2xl font-bold text-yellow-500">{users.filter(u => u.role === 'moderator').length}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">ถูกแบน</p>
            <p className="text-2xl font-bold text-red-400">{users.filter(u => u.banned).length}</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    ผู้ใช้
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    อีเมล
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Role
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
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#1a1a1a]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar userId={user.id} className="w-10 h-10" />
                        <div>
                          <p className="font-medium text-white">{user.displayName || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{user.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Mail size={14} />
                        <span className="text-sm">{user.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      {user.banned ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                          Banned
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {user.createdAt?.toDate().toLocaleDateString('th-TH') || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors text-blue-400 hover:text-blue-300"
                          title="แก้ไข"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleBanUser(user.id, user.banned)}
                          className={`p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors ${
                            user.banned ? 'text-green-400 hover:text-green-300' : 'text-orange-400 hover:text-orange-300'
                          }`}
                          title={user.banned ? 'ปลดแบน' : 'แบน'}
                        >
                          {user.banned ? <CheckCircle size={18} /> : <Ban size={18} />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
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

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">ไม่พบผู้ใช้</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">แก้ไขผู้ใช้</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">ชื่อผู้ใช้</label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">อีเมล</label>
                <input
                  type="email"
                  value={editForm.email}
                  disabled
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="banned"
                  checked={editForm.banned}
                  onChange={(e) => setEditForm({ ...editForm, banned: e.target.checked })}
                  className="w-4 h-4 rounded border-[#2a2a2a] bg-[#0a0a0a] text-purple-500 focus:ring-purple-500"
                />
                <label htmlFor="banned" className="text-sm text-gray-300">แบนผู้ใช้นี้</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-colors text-white"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveUser}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
