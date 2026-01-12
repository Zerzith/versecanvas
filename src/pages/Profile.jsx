import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Edit, MessageCircle, UserPlus, UserCheck, MapPin, Link as LinkIcon,
  Calendar, Save, X, Eye, Heart, Palette, BookOpen, Settings, Share2, Bookmark
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocial } from '../contexts/SocialContext';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc } from 'firebase/firestore';
import { uploadImage } from '../lib/cloudinary';
import FollowButton from '../components/FollowButton';
import UserAvatar from '../components/UserAvatar';

export default function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const { getFollowerCount, getFollowingCount } = useSocial();
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

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="relative">
                <img
                  src={profile.photoURL || 'https://via.placeholder.com/150'}
                  alt={profile.displayName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-purple-500"
                />
                {isOwnProfile && (
                  <label className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full cursor-pointer hover:bg-purple-700 transition">
                    <Edit size={18} />
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
              
              {/* Stats */}
              <div className="flex gap-6 text-center md:text-left">
                <div>
                  <div className="text-2xl font-bold">{stats.artworks}</div>
                  <div className="text-xs text-gray-400">ผลงาน</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.followers}</div>
                  <div className="text-xs text-gray-400">ผู้ติดตาม</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.following}</div>
                  <div className="text-xs text-gray-400">กำลังติดตาม</div>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{profile.displayName || 'ไม่ระบุชื่อ'}</h1>
                  <p className="text-gray-400">{profile.role === 'artist' ? '🎨 ศิลปิน' : '👤 ผู้ใช้งาน'}</p>
                </div>
                <div className="flex gap-2">
                  {isOwnProfile && (
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition flex items-center gap-2"
                    >
                      <Edit size={16} />
                      {isEditing ? 'ยกเลิก' : 'แก้ไข'}
                    </button>
                  )}
                  {!isOwnProfile && currentUser && (
                    <>
                      <button
                        onClick={() => navigate(`/messages/${targetUserId}`)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-2"
                      >
                        <MessageCircle size={16} />
                        ส่งข้อความ
                      </button>
                      <FollowButton userId={targetUserId} />
                    </>
                  )}
                </div>
              </div>

              {!isEditing ? (
                <div className="space-y-3">
                  {profile.bio && (
                    <p className="text-gray-300 text-sm">{profile.bio}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    {profile.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {profile.location}
                      </span>
                    )}
                    {profile.website && (
                      <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                        <LinkIcon size={14} />
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                    {profile?.createdAt && (
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        เข้าร่วมเมื่อ {new Date(profile.createdAt.seconds ? profile.createdAt.seconds * 1000 : profile.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 bg-[#1a1a1a] p-6 rounded-2xl border border-[#2a2a2a]">
                  <div>
                    <label className="block text-xs text-gray-500 mb-2 uppercase">ชื่อที่แสดง</label>
                    <input 
                      type="text" 
                      value={editForm.displayName} 
                      onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                      className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2 uppercase">ประวัติ</label>
                    <textarea 
                      value={editForm.bio} 
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2 uppercase">สถานที่</label>
                    <input 
                      type="text" 
                      value={editForm.location} 
                      onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2 uppercase">เว็บไซต์</label>
                    <input 
                      type="url" 
                      value={editForm.website} 
                      onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                      className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none"
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
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 overflow-x-auto mb-8 pb-2 border-b border-[#2a2a2a]">
          <button
            onClick={() => setActiveTab('artworks')}
            className={`px-6 py-3 whitespace-nowrap transition border-b-2 ${
              activeTab === 'artworks'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Palette size={18} className="inline mr-2" />
            ผลงาน ({stats.artworks})
          </button>
          <button
            onClick={() => setActiveTab('stories')}
            className={`px-6 py-3 whitespace-nowrap transition border-b-2 ${
              activeTab === 'stories'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <BookOpen size={18} className="inline mr-2" />
            นิยาย ({stats.stories})
          </button>
        </div>

        {/* Content Grid */}
        {activeTab === 'artworks' && (
          <>
            {artworks.length === 0 ? (
              <div className="text-center py-20">
                <Palette className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">ยังไม่มีผลงาน</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {artworks.map((artwork) => (
                  <Link
                    key={artwork.id}
                    to={`/artwork/${artwork.id}`}
                    className="group relative overflow-hidden rounded-xl bg-[#1a1a1a] aspect-square hover:scale-105 transition"
                  >
                    <img
                      src={artwork.imageUrl || artwork.image || 'https://via.placeholder.com/300'}
                      alt={artwork.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition flex items-end p-4">
                      <div className="text-white opacity-0 group-hover:opacity-100 transition w-full">
                        <p className="font-bold text-sm line-clamp-2 mb-2">{artwork.title}</p>
                        <div className="flex gap-3 text-xs text-gray-300">
                          <span className="flex items-center gap-1">
                            <Heart size={12} /> {artwork.likes || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye size={12} /> {artwork.views || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'stories' && (
          <>
            {stories.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">ยังไม่มีนิยาย</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((story) => (
                  <Link
                    key={story.id}
                    to={`/story/${story.id}`}
                    className="group bg-[#1a1a1a] rounded-2xl overflow-hidden border border-[#2a2a2a] hover:border-purple-500 transition"
                  >
                    <div className="aspect-video overflow-hidden bg-[#2a2a2a]">
                      <img
                        src={story.coverImage || 'https://via.placeholder.com/400x300'}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold line-clamp-2 group-hover:text-purple-400 transition mb-2">
                        {story.title}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                        {story.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{story.category}</span>
                        <span>{story.createdAt?.toLocaleDateString?.('th-TH') || 'ไม่ทราบ'}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
