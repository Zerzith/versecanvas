import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, Search, Edit2, Trash2, Ban, Shield, User, Mail, Calendar, Coins, MoreVertical, X } from 'lucide-react';
import toast from 'react-hot-toast';
import UserAvatar from '../../components/UserAvatar';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
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
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      displayName: user.displayName || '',
      role: user.role || 'user'
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        displayName: editForm.displayName,
        role: editForm.role,
        updatedAt: new Date()
      });

      setUsers(users.map(u =>
        u.id === selectedUser.id
          ? { ...u, ...editForm, updatedAt: new Date() }
          : u
      ));

      setShowEditModal(false);
      setSelectedUser(null);
      toast.success('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Error updating user: ' + error.message);
    }
  };

  const handleBanUser = async (userId, currentBanStatus) => {
    if (!confirm(`Are you sure you want to ${currentBanStatus ? 'unban' : 'ban'} this user?`)) return;

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

      toast.success(`User ${currentBanStatus ? 'unbanned' : 'banned'} successfully!`);
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Error: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone!')) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(u => u.id !== userId));
      toast.success('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error deleting user: ' + error.message);
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
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Users size={32} className="text-purple-500" />
            User Management
          </h1>
          <p className="text-gray-400">Manage all users and their roles</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2a2a2a] bg-[#0a0a0a]">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">User</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">Joined</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-[#2a2a2a] hover:bg-[#252525] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar userId={user.id} />
                        <span className="text-white font-medium">{user.displayName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{user.email}</td>
                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.banned ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                        {user.banned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {user.createdAt ? new Date(user.createdAt.toDate?.() || user.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 hover:bg-[#2a2a2a] rounded transition-colors text-gray-400 hover:text-white"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleBanUser(user.id, user.banned)}
                          className={`p-2 hover:bg-[#2a2a2a] rounded transition-colors ${user.banned ? 'text-yellow-500' : 'text-orange-500'}`}
                          title={user.banned ? 'Unban' : 'Ban'}
                        >
                          <Ban size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 hover:bg-[#2a2a2a] rounded transition-colors text-red-500 hover:text-red-400"
                          title="Delete"
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
              <Users size={48} className="mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Edit User</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-[#2a2a2a] text-white rounded hover:bg-[#3a3a3a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
