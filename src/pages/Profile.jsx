import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Grid, List, Settings, MapPin, Link as LinkIcon, 
  Calendar, Edit, MessageCircle, UserPlus, UserCheck,
  Heart, MessageSquare, CreditCard, Award, Image as ImageIcon,
  BookOpen, Star, Camera, Eye, Save, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocial } from '../contexts/SocialContext';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc } from 'firebase/firestore';
import { uploadImage } from '../lib/cloudinary';
import FollowButton from '../components/FollowButton';

export default function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const { getFollowerCount, getFollowingCount, getBookmarks } = useSocial();
  const [profile, setProfile] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('artworks');
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: ''
  });
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    artworks: 0,
    stories: 0
  });
  const [bookmarks, setBookmarks] = useState([]);

  const isOwnProfile = currentUser?.uid === (userId || currentUser?.uid);
  const targetUserId = userId || currentUser?.uid;

  useEffect(() => {
    if (targetUserId) {
      fetchProfileData();
    }
  }, [targetUserId]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Fetch user profile
      const userDoc = await getDoc(doc(db, 'users', targetUserId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfile(data);
        if (isOwnProfile) {
          setEditForm({
            displayName: data.displayName || '',
            bio: data.bio || '',
            location: data.location || '',
            website: data.website || ''
          });
        }
      }

      // Fetch artworks
      const artworksQuery = query(
        collection(db, 'artworks'),
        where('artistId', '==', targetUserId)
      );
      const artworksSnap = await getDocs(artworksQuery);
      const artworksData = artworksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setArtworks(artworksData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));

      // Fetch stories
      const storiesQuery = query(
        collection(db, 'stories'),
        where('authorId', '==', targetUserId),
        orderBy('createdAt', 'desc')
      );
      const storiesSnap = await getDocs(storiesQuery);
      const storiesData = storiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStories(storiesData);

      // Fetch bookmarks if own profile
      if (isOwnProfile) {
        const bookmarksData = await getBookmarks();
        setBookmarks(bookmarksData);
      }

      // Set stats
      const followerCount = await getFollowerCount(targetUserId);
      const followingCount = await getFollowingCount(targetUserId);
      setStats({
        followers: followerCount,
        following: followingCount,
        artworks: artworksData.length,
        stories: storiesData.length
      });

    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileImageUpload = async (e) => {
    if (!isOwnProfile) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        photoURL: imageUrl
      });
      setProfile(prev => prev ? { ...prev, photoURL: imageUrl } : null);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!isOwnProfile) return;
    
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: editForm.displayName,
        bio: editForm.bio,
        location: editForm.location,
        website: editForm.website
      });
      setProfile(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
          <p className="text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">ไม่พบโปรไฟล์</p>
          <Link
            to="/explore"
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg transition inline-block"
          >
            กลับไปหน้าแรก
          </Link>
        </div>
      </div>
    );
  }

  const displayArtworks = activeTab === 'artworks' ? artworks : 
                         activeTab === 'stories' ? stories :
                         activeTab === 'bookmarks' ? bookmarks : [];

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-[#1a1a1a] rounded-3xl p-8 border border-[#2a2a2a] mb-8">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* Avatar */}
            <div className="relative">
              <img
                src={profile.photoURL || 'https://via.placeholder.com/200'}
                alt={profile.displayName}
                className="w-32 h-32 rounded-full object-cover border-4 border-purple-500"
              />
              {isOwnProfile && (
                <label className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full cursor-pointer hover:bg-purple-700 transition">
                  <Camera size={20} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-3xl font-bold">{profile.displayName || 'ไม่ระบุชื่อ'}</h1>
                {!isOwnProfile && currentUser && (
                  <FollowButton userId={targetUserId} />
                )}
              </div>

              {/* Stats */}
              <div className="flex justify-center md:justify-start gap-8 mb-6">
                <div className="text-center md:text-left">
                  <span className="font-bold block md:inline mr-1">{stats.artworks + stats.stories}</span>
                  <span className="text-gray-400 text-sm">โพสต์</span>
                </div>
                <div className="text-center md:text-left">
                  <span className="font-bold block md:inline mr-1">{stats.followers}</span>
                  <span className="text-gray-400 text-sm">ผู้ติดตาม</span>
                </div>
                <div className="text-center md:text-left">
                  <span className="font-bold block md:inline mr-1">{stats.following}</span>
                  <span className="text-gray-400 text-sm">กำลังติดตาม</span>
                </div>
                {profile?.createdAt && (
                  <div className="text-center md:text-left">
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(profile.createdAt.seconds ? profile.createdAt.seconds * 1000 : profile.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>

              {/* Bio & Links */}
              {!isEditing ? (
                <div className="space-y-2">
                  <p className="font-medium">{profile.role === 'artist' ? '🎨 ศิลปิน' : '👤 ผู้ใช้งาน'}</p>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{profile.bio || 'ยังไม่มีคำอธิบายตัวเอง'}</p>
                  {profile?.createdAt && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={12} />
                      เข้าร่วมเมื่อ {new Date(profile.createdAt.seconds ? profile.createdAt.seconds * 1000 : profile.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-400">
                    {profile.location && (
                      <span className="flex items-center gap-1"><MapPin size={14} /> {profile.location}</span>
                    )}
                    {profile.website && (
                      <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                        <LinkIcon size={14} /> {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 bg-[#2a2a2a] p-6 rounded-2xl">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 uppercase">ชื่อที่แสดง</label>
                    <input 
                      type="text" 
                      value={editForm.displayName} 
                      onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 uppercase">ประวัติ</label>
                    <textarea 
                      value={editForm.bio} 
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-4 py-2 text-white"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 uppercase">สถานที่</label>
                    <input 
                      type="text" 
                      value={editForm.location} 
                      onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 uppercase">เว็บไซต์</label>
                    <input 
                      type="url" 
                      value={editForm.website} 
                      onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <Save size={16} /> บันทึก
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <X size={16} /> ยกเลิก
                    </button>
                  </div>
                </div>
              )}

              {isOwnProfile && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition flex items-center gap-2"
                >
                  <Edit size={16} /> แก้ไขโปรไฟล์
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 overflow-x-auto mb-8 pb-2">
          <button
            onClick={() => setActiveTab('artworks')}
            className={`px-6 py-3 rounded-xl whitespace-nowrap transition ${
              activeTab === 'artworks'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                : 'bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500'
            }`}
          >
            <Grid size={18} className="inline mr-2" /> ผลงาน ({stats.artworks})
          </button>
          <button
            onClick={() => setActiveTab('stories')}
            className={`px-6 py-3 rounded-xl whitespace-nowrap transition ${
              activeTab === 'stories'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                : 'bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500'
            }`}
          >
            <BookOpen size={18} className="inline mr-2" /> นิยาย ({stats.stories})
          </button>
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`px-6 py-3 rounded-xl whitespace-nowrap transition ${
                activeTab === 'bookmarks'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'bg-[#1a1a1a] border border-[#2a2a2a] hover:border-purple-500'
              }`}
            >
              <Heart size={18} className="inline mr-2" /> บันทึก ({bookmarks.length})
            </button>
          )}
        </div>

        {/* Content */}
        {displayArtworks.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400">ยังไม่มีเนื้อหา</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayArtworks.map((item) => (
              <Link
                key={item.id}
                to={activeTab === 'stories' ? `/story/${item.id}` : `/artwork/${item.id}`}
                className="group relative overflow-hidden rounded-xl bg-[#1a1a1a] aspect-square hover:scale-105 transition"
              >
                <img
                  src={item.coverImage || item.imageUrl || item.image || 'https://via.placeholder.com/300'}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end p-4">
                  <div className="text-white opacity-0 group-hover:opacity-100 transition">
                    <p className="font-bold text-sm line-clamp-2">{item.title}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
