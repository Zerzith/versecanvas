import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Bell, Lock, Eye, Shield, AlertCircle, Trash2, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { currentUser, logout } = useAuth();
  const { settings, updateSetting, updateSettings, loading } = useSettings();
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('privacy');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      showMessage('success', 'บันทึกการตั้งค่าสำเร็จ!');
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showMessage('error', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setChangingPassword(true);
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordForm.currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, passwordForm.newPassword);
      
      showMessage('success', 'เปลี่ยนรหัสผ่านสำเร็จ!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        showMessage('error', 'รหัสผ่านปัจจุบันไม่ถูกต้อง');
      } else {
        showMessage('error', 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showMessage('error', 'กรุณากรอกรหัสผ่าน');
      return;
    }

    setDeleting(true);
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        deletePassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Delete user data from Firestore
      await deleteDoc(doc(db, 'users', currentUser.uid));

      // Delete user account
      await deleteUser(currentUser);

      showMessage('success', 'ลบบัญชีสำเร็จ');
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/wrong-password') {
        showMessage('error', 'รหัสผ่านไม่ถูกต้อง');
      } else {
        showMessage('error', 'เกิดข้อผิดพลาดในการลบบัญชี');
      }
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setDeletePassword('');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSettingChange = async (key, value) => {
    await updateSetting(key, value);
  };

  // เหลือแค่ 4 หมวด: ความเป็นส่วนตัว, การแจ้งเตือน, เนื้อหา, บัญชี
  const sections = [
    { id: 'privacy', name: 'ความเป็นส่วนตัว', icon: Shield },
    { id: 'notifications', name: 'การแจ้งเตือน', icon: Bell },
    { id: 'content', name: 'เนื้อหา', icon: Eye },
    { id: 'account', name: 'บัญชี', icon: Lock },
  ];

  const ToggleSwitch = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition ${
        checked ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-[#2a2a2a]'
      }`}
    >
      <div
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? 'transform translate-x-6' : ''
        }`}
      />
    </button>
  );

  const SettingItem = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between py-4 border-b border-[#2a2a2a]">
      <div className="flex-1">
        <h3 className="font-medium mb-1">{label}</h3>
        {description && <p className="text-sm text-gray-400">{description}</p>}
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );

  const SelectSetting = ({ label, description, value, options, onChange }) => (
    <div className="py-4 border-b border-[#2a2a2a]">
      <h3 className="font-medium mb-1">{label}</h3>
      {description && <p className="text-sm text-gray-400 mb-3">{description}</p>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
          <p className="text-gray-400">กำลังโหลดการตั้งค่า...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-400 mb-4">กรุณาเข้าสู่ระบบเพื่อตั้งค่า</p>
          <a
            href="/login"
            className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition"
          >
            เข้าสู่ระบบ
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 bg-clip-text text-transparent">
          ตั้งค่า
        </h1>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-500/20 border border-green-500/50 text-green-400'
              : 'bg-red-500/20 border border-red-500/50 text-red-400'
          }`}>
            <AlertCircle size={20} />
            <span>{message.text}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a] sticky top-24">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition mb-2 ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                        : 'hover:bg-[#2a2a2a] text-gray-400'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{section.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
              {/* Privacy Settings */}
              {activeSection === 'privacy' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">ความเป็นส่วนตัว</h2>
                  
                  <SelectSetting
                    label="การมองเห็นโปรไฟล์"
                    description="กำหนดว่าใครสามารถเห็นโปรไฟล์ของคุณได้"
                    value={settings.profileVisibility || 'public'}
                    options={[
                      { value: 'public', label: 'สาธารณะ - ทุกคนสามารถเห็นได้' },
                      { value: 'followers', label: 'ผู้ติดตามเท่านั้น' },
                      { value: 'private', label: 'ส่วนตัว - เฉพาะตัวเอง' }
                    ]}
                    onChange={(value) => handleSettingChange('profileVisibility', value)}
                  />

                  <SettingItem
                    label="แสดงอีเมล"
                    description="อนุญาตให้ผู้อื่นเห็นอีเมลของคุณในโปรไฟล์"
                    checked={settings.showEmail || false}
                    onChange={(value) => handleSettingChange('showEmail', value)}
                  />

                  <SettingItem
                    label="แสดงผู้ติดตาม"
                    description="แสดงรายชื่อผู้ติดตามในโปรไฟล์ของคุณ"
                    checked={settings.showFollowers !== false}
                    onChange={(value) => handleSettingChange('showFollowers', value)}
                  />

                  <SettingItem
                    label="อนุญาตให้ส่งข้อความ"
                    description="ผู้อื่นสามารถส่งข้อความถึงคุณได้"
                    checked={settings.allowMessages !== false}
                    onChange={(value) => handleSettingChange('allowMessages', value)}
                  />

                  <SettingItem
                    label="อนุญาตให้แสดงความคิดเห็น"
                    description="ผู้อื่นสามารถแสดงความคิดเห็นในโพสต์ของคุณได้"
                    checked={settings.allowComments !== false}
                    onChange={(value) => handleSettingChange('allowComments', value)}
                  />
                </div>
              )}

              {/* Notification Settings */}
              {activeSection === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">การแจ้งเตือน</h2>
                  
                  <SettingItem
                    label="การแจ้งเตือนทางอีเมล"
                    description="รับการแจ้งเตือนผ่านทางอีเมล"
                    checked={settings.emailNotifications !== false}
                    onChange={(value) => handleSettingChange('emailNotifications', value)}
                  />

                  <SettingItem
                    label="แจ้งเตือนผู้ติดตามใหม่"
                    description="รับการแจ้งเตือนเมื่อมีคนติดตามคุณ"
                    checked={settings.notifyNewFollower !== false}
                    onChange={(value) => handleSettingChange('notifyNewFollower', value)}
                  />

                  <SettingItem
                    label="แจ้งเตือนการกดไลค์"
                    description="รับการแจ้งเตือนเมื่อมีคนกดไลค์ผลงานของคุณ"
                    checked={settings.notifyLikes !== false}
                    onChange={(value) => handleSettingChange('notifyLikes', value)}
                  />

                  <SettingItem
                    label="แจ้งเตือนความคิดเห็น"
                    description="รับการแจ้งเตือนเมื่อมีคนแสดงความคิดเห็นในผลงานของคุณ"
                    checked={settings.notifyComments !== false}
                    onChange={(value) => handleSettingChange('notifyComments', value)}
                  />

                  <SettingItem
                    label="แจ้งเตือนข้อความ"
                    description="รับการแจ้งเตือนเมื่อมีข้อความใหม่"
                    checked={settings.notifyMessages !== false}
                    onChange={(value) => handleSettingChange('notifyMessages', value)}
                  />

                  <SettingItem
                    label="แจ้งเตือนคำสั่งซื้อ"
                    description="รับการแจ้งเตือนเมื่อมีคำสั่งซื้อใหม่หรือมีการอัปเดตสถานะ"
                    checked={settings.notifyOrders !== false}
                    onChange={(value) => handleSettingChange('notifyOrders', value)}
                  />
                </div>
              )}

              {/* Content Settings */}
              {activeSection === 'content' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">เนื้อหา</h2>
                  
                  <SettingItem
                    label="แสดงเนื้อหาสำหรับผู้ใหญ่"
                    description="อนุญาตให้แสดงเนื้อหาที่จำกัดอายุ (18+)"
                    checked={settings.showAdultContent || false}
                    onChange={(value) => handleSettingChange('showAdultContent', value)}
                  />

                  <SettingItem
                    label="เล่นวิดีโออัตโนมัติ"
                    description="เล่นวิดีโอโดยอัตโนมัติเมื่อเลื่อนผ่าน"
                    checked={settings.autoplayVideos !== false}
                    onChange={(value) => handleSettingChange('autoplayVideos', value)}
                  />

                  <SettingItem
                    label="โหลดรูปภาพคุณภาพสูง"
                    description="โหลดรูปภาพความละเอียดสูงโดยอัตโนมัติ (ใช้ข้อมูลมากขึ้น)"
                    checked={settings.highQualityImages !== false}
                    onChange={(value) => handleSettingChange('highQualityImages', value)}
                  />

                  <SelectSetting
                    label="ภาษาเนื้อหา"
                    description="เลือกภาษาที่ต้องการให้แสดงเนื้อหา"
                    value={settings.contentLanguage || 'all'}
                    options={[
                      { value: 'all', label: 'ทุกภาษา' },
                      { value: 'th', label: 'ไทยเท่านั้น' },
                      { value: 'en', label: 'English only' }
                    ]}
                    onChange={(value) => handleSettingChange('contentLanguage', value)}
                  />
                </div>
              )}

              {/* Account Settings */}
              {activeSection === 'account' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">บัญชี</h2>
                  
                  {/* Account Info */}
                  <div className="mb-8 p-4 bg-[#2a2a2a] rounded-xl">
                    <h3 className="font-medium mb-3">ข้อมูลบัญชี</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-400">อีเมล:</span> {currentUser.email}</p>
                      <p><span className="text-gray-400">UID:</span> {currentUser.uid}</p>
                      <p><span className="text-gray-400">สร้างเมื่อ:</span> {currentUser.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString('th-TH') : 'ไม่ทราบ'}</p>
                    </div>
                  </div>

                  {/* Change Password */}
                  <div className="mb-8">
                    <h3 className="font-medium mb-4">เปลี่ยนรหัสผ่าน</h3>
                    <div className="space-y-4">
                      <input
                        type="password"
                        placeholder="รหัสผ่านปัจจุบัน"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                      />
                      <input
                        type="password"
                        placeholder="รหัสผ่านใหม่"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                      />
                      <input
                        type="password"
                        placeholder="ยืนยันรหัสผ่านใหม่"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={handleChangePassword}
                        disabled={changingPassword}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 font-medium transition disabled:opacity-50"
                      >
                        {changingPassword ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
                      </button>
                    </div>
                  </div>

                  {/* Logout */}
                  <div className="mb-8">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] font-medium transition"
                    >
                      <LogOut size={20} />
                      ออกจากระบบ
                    </button>
                  </div>

                  {/* Delete Account */}
                  <div className="border-t border-[#2a2a2a] pt-6">
                    <h3 className="font-medium mb-2 text-red-400">ลบบัญชี</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      การลบบัญชีจะลบข้อมูลทั้งหมดของคุณอย่างถาวร รวมถึงผลงาน นิยาย และข้อมูลอื่นๆ
                    </p>
                    
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/30 transition"
                      >
                        <Trash2 size={18} />
                        ลบบัญชีของฉัน
                      </button>
                    ) : (
                      <div className="p-4 bg-red-600/10 border border-red-600/30 rounded-xl">
                        <p className="text-sm text-red-400 mb-4">
                          คุณแน่ใจหรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้
                        </p>
                        <input
                          type="password"
                          placeholder="กรอกรหัสผ่านเพื่อยืนยัน"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          className="w-full bg-[#2a2a2a] border border-red-600/50 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-red-500"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(false);
                              setDeletePassword('');
                            }}
                            className="flex-1 py-2 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] transition"
                          >
                            ยกเลิก
                          </button>
                          <button
                            onClick={handleDeleteAccount}
                            disabled={deleting}
                            className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
                          >
                            {deleting ? 'กำลังลบ...' : 'ยืนยันลบบัญชี'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
