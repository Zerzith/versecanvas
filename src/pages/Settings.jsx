import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { 
  User, Bell, Lock, Eye, Globe, Shield, 
  Monitor, Check, Save, Key
} from 'lucide-react';

export default function Settings() {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState({
    // Display Settings
    theme: 'dark',
    language: 'th',
    fontSize: 'medium',
    
    // Privacy Settings
    profileVisibility: 'public',
    showEmail: false,
    showFollowers: true,
    allowMessages: true,
    allowComments: true,
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    newFollower: true,
    newComment: true,
    newLike: true,
    newMessage: true,
    commissionRequest: true,
    
    // Content Settings
    nsfwFilter: true,
    autoplay: false,
    showSensitiveContent: false,
    
    // Account Settings
    twoFactorAuth: false,
    loginAlerts: true,
  });

  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('display');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [currentUser]);

  const loadSettings = async () => {
    if (!currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().settings) {
        setSettings({ ...settings, ...userDoc.data().settings });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        settings
      });
      alert('บันทึกการตั้งค่าสำเร็จ!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
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
      
      alert('เปลี่ยนรหัสผ่านสำเร็จ!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        alert('รหัสผ่านปัจจุบันไม่ถูกต้อง');
      } else {
        alert('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const sections = [
    { id: 'display', name: 'การแสดงผล', icon: Monitor },
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
        className={`absolute top-1 left-1 w-4 h-4 bg-[#1a1a1a] rounded-full transition-transform ${
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

  const SelectSetting = ({ label, value, options, onChange }) => (
    <div className="py-4 border-b border-[#2a2a2a]">
      <h3 className="font-medium mb-3">{label}</h3>
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

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-pink-500 via-purple-500 to-teal-500 bg-clip-text text-transparent">
          ตั้งค่า
        </h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a] sticky top-8">
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
              {/* Display Settings */}
              {activeSection === 'display' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">การแสดงผล</h2>
                  
                  <SelectSetting
                    label="ธีม"
                    value={settings.theme}
                    options={[
                      { value: 'dark', label: 'โหมดมืด' },
                      { value: 'light', label: 'โหมดสว่าง' },
                      { value: 'auto', label: 'อัตโนมัติ' }
                    ]}
                    onChange={(value) => updateSetting('theme', value)}
                  />

                  <SelectSetting
                    label="ภาษา"
                    value={settings.language}
                    options={[
                      { value: 'th', label: 'ไทย' },
                      { value: 'en', label: 'English' }
                    ]}
                    onChange={(value) => updateSetting('language', value)}
                  />

                  <SelectSetting
                    label="ขนาดตัวอักษร"
                    value={settings.fontSize}
                    options={[
                      { value: 'small', label: 'เล็ก' },
                      { value: 'medium', label: 'ปานกลาง' },
                      { value: 'large', label: 'ใหญ่' }
                    ]}
                    onChange={(value) => updateSetting('fontSize', value)}
                  />
                </div>
              )}

              {/* Privacy Settings */}
              {activeSection === 'privacy' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">ความเป็นส่วนตัว</h2>
                  
                  <SelectSetting
                    label="การมองเห็นโปรไฟล์"
                    value={settings.profileVisibility}
                    options={[
                      { value: 'public', label: 'สาธารณะ' },
                      { value: 'followers', label: 'ผู้ติดตามเท่านั้น' },
                      { value: 'private', label: 'ส่วนตัว' }
                    ]}
                    onChange={(value) => updateSetting('profileVisibility', value)}
                  />

                  <SettingItem
                    label="แสดงอีเมล"
                    description="อนุญาตให้ผู้อื่นเห็นอีเมลของคุณ"
                    checked={settings.showEmail}
                    onChange={(value) => updateSetting('showEmail', value)}
                  />

                  <SettingItem
                    label="แสดงผู้ติดตาม"
                    description="แสดงรายชื่อผู้ติดตามในโปรไฟล์"
                    checked={settings.showFollowers}
                    onChange={(value) => updateSetting('showFollowers', value)}
                  />

                  <SettingItem
                    label="อนุญาตให้ส่งข้อความ"
                    description="ผู้อื่นสามารถส่งข้อความถึงคุณได้"
                    checked={settings.allowMessages}
                    onChange={(value) => updateSetting('allowMessages', value)}
                  />

                  <SettingItem
                    label="อนุญาตให้แสดงความคิดเห็น"
                    description="ผู้อื่นสามารถแสดงความคิดเห็นในโพสต์ของคุณได้"
                    checked={settings.allowComments}
                    onChange={(value) => updateSetting('allowComments', value)}
                  />
                </div>
              )}

              {/* Notification Settings */}
              {activeSection === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">การแจ้งเตือน</h2>
                  
                  <SettingItem
                    label="การแจ้งเตือนทางอีเมล"
                    description="รับการแจ้งเตือนผ่านอีเมล"
                    checked={settings.emailNotifications}
                    onChange={(value) => updateSetting('emailNotifications', value)}
                  />

                  <SettingItem
                    label="การแจ้งเตือนแบบ Push"
                    description="รับการแจ้งเตือนแบบ Push บนอุปกรณ์"
                    checked={settings.pushNotifications}
                    onChange={(value) => updateSetting('pushNotifications', value)}
                  />

                  <div className="mt-6 mb-4">
                    <h3 className="font-medium text-gray-400">แจ้งเตือนเมื่อ</h3>
                  </div>

                  <SettingItem
                    label="มีผู้ติดตามใหม่"
                    checked={settings.newFollower}
                    onChange={(value) => updateSetting('newFollower', value)}
                  />

                  <SettingItem
                    label="มีความคิดเห็นใหม่"
                    checked={settings.newComment}
                    onChange={(value) => updateSetting('newComment', value)}
                  />

                  <SettingItem
                    label="มีการกดไลค์"
                    checked={settings.newLike}
                    onChange={(value) => updateSetting('newLike', value)}
                  />

                  <SettingItem
                    label="มีข้อความใหม่"
                    checked={settings.newMessage}
                    onChange={(value) => updateSetting('newMessage', value)}
                  />

                  <SettingItem
                    label="มีคำขอคอมมิชชั่น"
                    checked={settings.commissionRequest}
                    onChange={(value) => updateSetting('commissionRequest', value)}
                  />
                </div>
              )}

              {/* Content Settings */}
              {activeSection === 'content' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">เนื้อหา</h2>
                  
                  <SettingItem
                    label="กรองเนื้อหา NSFW"
                    description="ซ่อนเนื้อหาที่ไม่เหมาะสมอัตโนมัติ"
                    checked={settings.nsfwFilter}
                    onChange={(value) => updateSetting('nsfwFilter', value)}
                  />

                  <SettingItem
                    label="เล่นวิดีโออัตโนมัติ"
                    description="เล่นวิดีโอโดยอัตโนมัติเมื่อเลื่อนดู"
                    checked={settings.autoplay}
                    onChange={(value) => updateSetting('autoplay', value)}
                  />

                  <SettingItem
                    label="แสดงเนื้อหาที่ละเอียดอ่อน"
                    description="แสดงเนื้อหาที่อาจมีความละเอียดอ่อน"
                    checked={settings.showSensitiveContent}
                    onChange={(value) => updateSetting('showSensitiveContent', value)}
                  />
                </div>
              )}

              {/* Account Settings */}
              {activeSection === 'account' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">บัญชี</h2>
                  
                  <SettingItem
                    label="การยืนยันตัวตนแบบสองขั้นตอน"
                    description="เพิ่มความปลอดภัยให้กับบัญชีของคุณ"
                    checked={settings.twoFactorAuth}
                    onChange={(value) => updateSetting('twoFactorAuth', value)}
                  />

                  <SettingItem
                    label="แจ้งเตือนการเข้าสู่ระบบ"
                    description="แจ้งเตือนเมื่อมีการเข้าสู่ระบบจากอุปกรณ์ใหม่"
                    checked={settings.loginAlerts}
                    onChange={(value) => updateSetting('loginAlerts', value)}
                  />

                  {/* Change Password */}
                  <div className="mt-8 pt-8 border-t border-[#2a2a2a]">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Key size={20} />
                      เปลี่ยนรหัสผ่าน
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">รหัสผ่านปัจจุบัน</label>
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">รหัสผ่านใหม่</label>
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">ยืนยันรหัสผ่านใหม่</label>
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <button
                        onClick={handleChangePassword}
                        disabled={changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {changingPassword ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            กำลังเปลี่ยนรหัสผ่าน...
                          </>
                        ) : (
                          <>
                            <Key size={18} />
                            เปลี่ยนรหัสผ่าน
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 pt-8 border-t border-[#2a2a2a]">
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      บันทึกการตั้งค่า
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
