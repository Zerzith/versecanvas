import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Settings as SettingsIcon, Save, Globe, DollarSign, Bell, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: 'Versecanvas',
    siteDescription: 'แพลตฟอร์มสำหรับนักเขียนและศิลปิน',
    creditPrice: 100, // 100 บาท = 1000 credits
    minWithdrawal: 500,
    commissionRate: 10, // 10%
    maintenanceMode: false,
    allowRegistration: true,
    emailNotifications: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'site'));
      if (settingsDoc.exists()) {
        setSettings({ ...settings, ...settingsDoc.data() });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'site'), {
        ...settings,
        updatedAt: new Date()
      });
      toast.success('บันทึกการตั้งค่าสำเร็จ!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">ตั้งค่าระบบ</h1>
          <p className="text-gray-400">จัดการการตั้งค่าทั่วไปของเว็บไซต์</p>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-bold text-white">ตั้งค่าทั่วไป</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ชื่อเว็บไซต์
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => handleChange('siteName', e.target.value)}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  คำอธิบายเว็บไซต์
                </label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => handleChange('siteDescription', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Settings */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-bold text-white">ตั้งค่าการเงิน</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ราคา Credits (บาท/1000 credits)
                </label>
                <input
                  type="number"
                  value={settings.creditPrice}
                  onChange={(e) => handleChange('creditPrice', Number(e.target.value))}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ปัจจุบัน: {settings.creditPrice} บาท = 1000 credits
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ยอดถอนขั้นต่ำ (บาท)
                </label>
                <input
                  type="number"
                  value={settings.minWithdrawal}
                  onChange={(e) => handleChange('minWithdrawal', Number(e.target.value))}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  อัตราค่าคอมมิชชั่น (%)
                </label>
                <input
                  type="number"
                  value={settings.commissionRate}
                  onChange={(e) => handleChange('commissionRate', Number(e.target.value))}
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  เว็บไซต์จะหัก {settings.commissionRate}% จากการขาย
                </p>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold text-white">ความปลอดภัย</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">โหมดปิดปรับปรุง</p>
                  <p className="text-sm text-gray-400">ปิดเว็บไซต์ชั่วคราวเพื่อปรับปรุง</p>
                </div>
                <button
                  onClick={() => handleChange('maintenanceMode', !settings.maintenanceMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.maintenanceMode ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">อนุญาตการสมัครสมาชิก</p>
                  <p className="text-sm text-gray-400">เปิด/ปิดการสมัครสมาชิกใหม่</p>
                </div>
                <button
                  onClick={() => handleChange('allowRegistration', !settings.allowRegistration)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.allowRegistration ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.allowRegistration ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-white">การแจ้งเตือน</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">การแจ้งเตือนทางอีเมล</p>
                  <p className="text-sm text-gray-400">ส่งอีเมลแจ้งเตือนถึงผู้ใช้</p>
                </div>
                <button
                  onClick={() => handleChange('emailNotifications', !settings.emailNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailNotifications ? 'bg-purple-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg transition-colors text-white font-medium"
            >
              <Save size={20} />
              {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
