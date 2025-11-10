import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocial } from '../contexts/SocialContext';
import { uploadImage } from '../lib/cloudinary';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  User, Settings, Heart, Users, MessageCircle, Edit, Camera, 
  BookOpen, Palette, Briefcase, Eye, Save, Send
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export default function Profile() {
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const { getFollowerCount, getFollowingCount } = useSocial();
  const [activeTab, setActiveTab] = useState('งานศิลปะ');
  const [userProfile, setUserProfile] = useState(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: ''
  });

  const tabs = ['งานศิลปะ', 'เรื่องราว', 'คอมมิชชั่น', 'คอลเลคชั่น'];

  // ใช้ userId จาก URL ถ้ามี ไม่มีใช้ currentUser.uid
  const profileUserId = userId || currentUser?.uid;
  const isOwnProfile = currentUser && profileUserId === currentUser.uid;

  useEffect(() => {
    if (profileUserId) {
      loadUserProfile();
      loadStats();
    }
  }, [profileUserId]);

  const loadUserProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', profileUserId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile(data);
        setEditForm({
          displayName: data.displayName || '',
          bio: data.bio || '',
          location: data.location || '',
          website: data.website || ''
        });
      } else {
        // Create default profile
        const defaultProfile = {
          displayName: currentUser.displayName || currentUser.email.split('@')[0],
          email: currentUser.email,
          photoURL: currentUser.photoURL || '',
          bio: '',
          location: '',
          website: '',
          createdAt: new Date()
        };
        setUserProfile(defaultProfile);
        setEditForm({
          displayName: defaultProfile.displayName,
          bio: '',
          location: '',
          website: ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadStats = async () => {
    try {
      const followerCount = await getFollowerCount(profileUserId);
      const followingCount = await getFollowingCount(profileUserId);
      setFollowers(followerCount);
      setFollowing(followingCount);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadImage(file, {
        folder: 'versecanvas/profiles',
        tags: ['profile']
      });

      await updateDoc(doc(db, 'users', currentUser.uid), {
        photoURL: result.url
      });

      setUserProfile({ ...userProfile, photoURL: result.url });
      alert('อัปโหลดรูปโปรไฟล์สำเร็จ!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setUploading(false);
    }
  };

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadImage(file, {
        folder: 'versecanvas/covers',
        tags: ['cover']
      });

      await updateDoc(doc(db, 'users', currentUser.uid), {
        coverURL: result.url
      });

      setUserProfile({ ...userProfile, coverURL: result.url });
      alert('อัปโหลดรูปปกสำเร็จ!');
    } catch (error) {
      console.error('Error uploading cover:', error);
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปปก');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: editForm.displayName,
        bio: editForm.bio,
        location: editForm.location,
        website: editForm.website
      });

      setUserProfile({ ...userProfile, ...editForm });
      setIsEditing(false);
      alert('บันทึกข้อมูลสำเร็จ!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  // Data will be loaded from Firebase

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-400 mb-4">กรุณาเข้าสู่ระบบ</p>
          <Link
            to="/login"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 font-medium transition inline-block"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-16">
      {/* Cover Image - ลดความสูงลง */}
      <div className="relative h-48 bg-gradient-to-r from-pink-900 via-purple-900 to-teal-900">
        {userProfile?.coverURL && (
          <img
            src={userProfile.coverURL}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/30"></div>
        {isOwnProfile && (
          <label className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 p-2 rounded-full transition cursor-pointer">
            <Camera className="w-4 h-4" />
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleCoverImageUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {/* Profile Header - กระชับขึ้น */}
      <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-10">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end mb-6">
          {/* Profile Image - ลดขนาด */}
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-[#0f0f0f] bg-gradient-to-br from-pink-500 via-purple-500 to-teal-500 p-1">
              <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
            </div>
            {isOwnProfile && (
              <label className="absolute bottom-0 right-0 bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-full cursor-pointer hover:scale-110 transition">
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  disabled={uploading}
                />
              </label>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Profile Info - กระชับขึ้น */}
          <div className="flex-1">
            {!isEditing ? (
              <>
                <h1 className="text-2xl font-bold mb-1">
                  {userProfile?.displayName || currentUser.email.split('@')[0]}
                </h1>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                  {userProfile?.bio || 'ยังไม่มีประวัติ'}
                </p>
                <div className="flex flex-wrap gap-3 text-xs">
                  {userProfile?.location && (
                    <span className="text-gray-500">📍 {userProfile.location}</span>
                  )}
                  {userProfile?.website && (
                    <a
                      href={userProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300"
                    >
                      🔗 {userProfile.website}
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4 bg-[#1a1a1a] p-6 rounded-2xl border border-[#2a2a2a]">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">ชื่อที่แสดง</label>
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                    className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">ประวัติ</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500 resize-none"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">ที่อยู่</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">เว็บไซต์</label>
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveProfile}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    บันทึก
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] transition"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}
            
            {/* Stats - กระชับขึ้น */}
            <div className="flex gap-4 mt-3">
              <div>
                <span className="text-lg font-bold text-purple-400">{followers}</span>
                <span className="text-xs text-gray-400 ml-1">ผู้ติดตาม</span>
              </div>
              <div>
                <span className="text-lg font-bold text-purple-400">{following}</span>
                <span className="text-xs text-gray-400 ml-1">กำลังติดตาม</span>
              </div>
              <div>
                <span className="text-lg font-bold text-purple-400">0</span>
                <span className="text-xs text-gray-400 ml-1">ผลงาน</span>
              </div>
            </div>
          </div>

          {/* Action Buttons - กระชับขึ้น */}
          <div className="flex gap-2">
            {isOwnProfile ? (
              <>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500 transition flex items-center gap-2 text-sm"
                  >
                    <Edit size={16} />
                    แก้ไข
                  </button>
                )}
                <Link
                  to="/settings"
                  className="px-4 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500 transition flex items-center gap-2 text-sm"
                >
                  <Settings size={16} />
                  ตั้งค่า
                </Link>
              </>
            ) : (
              <>
                {/* ปุ่มส่งข้อความสำหรับโปรไฟล์คนอื่น */}
                <Link
                  to={`/messages?userId=${profileUserId}`}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition flex items-center gap-2 text-sm font-medium"
                >
                  <Send size={16} />
                  ส่งข้อความ
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-[#2a2a2a] mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium whitespace-nowrap transition border-b-2 ${
                activeTab === tab
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="pb-12">
          {activeTab === 'งานศิลปะ' && (
            <div className="text-center py-12">
              <Palette className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400">ยังไม่มีงานศิลปะ</p>
              {isOwnProfile && (
                <Link
                  to="/upload-artwork"
                  className="inline-block mt-4 px-6 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 font-medium transition"
                >
                  อัปโหลดงานแรก
                </Link>
              )}
            </div>
          )}

          {activeTab === 'เรื่องราว' && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400">ยังไม่มีเรื่องราว</p>
              {isOwnProfile && (
                <Link
                  to="/create-story"
                  className="inline-block mt-4 px-6 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 font-medium transition"
                >
                  สร้างเรื่องราว
                </Link>
              )}
            </div>
          )}

          {(activeTab === 'คอมมิชชั่น' || activeTab === 'คอลเลคชั่น') && (
            <div className="text-center py-12">
              <Palette className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400">ยังไม่มีเนื้อหาในส่วนนี้</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
