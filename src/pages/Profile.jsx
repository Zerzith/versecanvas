import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const { getFollowerCount, getFollowingCount } = useSocial();
  const [profile, setProfile] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('artworks'); // artworks, stories, about
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
        where('authorId', '==', targetUserId)
      );
      const storiesSnap = await getDocs(storiesQuery);
      const storiesData = storiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStories(storiesData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));

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
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadImage(file, { folder: 'versecanvas/profiles' });
      await updateDoc(doc(db, 'users', currentUser.uid), { photoURL: result.url });
      setProfile({ ...profile, photoURL: result.url });
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), editForm);
      setProfile({ ...profile, ...editForm });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white">
        <p>ไม่พบข้อมูลผู้ใช้</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-20 pb-10">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Profile Header - Instagram Style */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
              <div className="w-full h-full rounded-full border-4 border-[#0f0f0f] overflow-hidden relative group">
                <img 
                  src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}&background=random`} 
                  className="w-full h-full object-cover"
                  alt={profile.displayName}
                />
                {isOwnProfile && (
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer">
                    <Camera className="text-white" size={24} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleProfileImageUpload} disabled={uploading} />
                  </label>
                )}
              </div>
            </div>
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
              <h1 className="text-2xl font-bold">{profile.displayName}</h1>
              <div className="flex items-center justify-center md:justify-start gap-2">
                {isOwnProfile ? (
                  <>
                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-4 py-1.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-sm font-medium transition"
                    >
                      {isEditing ? 'ยกเลิก' : 'แก้ไขโปรไฟล์'}
                    </button>
                    <Link to="/settings" className="p-1.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition">
                      <Settings size={20} />
                    </Link>
                  </>
                ) : (
                  <>
                    <FollowButton userId={targetUserId} />
                    <Link 
                      to={`/messages?userId=${targetUserId}&userName=${profile.displayName}`}
                      className="px-4 py-1.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg text-sm font-medium transition flex items-center gap-2"
                    >
                      <MessageCircle size={18} />
                      ส่งข้อความ
                    </Link>
                  </>
                )}
              </div>
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
            </div>

            {/* Bio & Links */}
            {!isEditing ? (
              <div className="space-y-2">
                <p className="font-medium">{profile.role === 'artist' ? '🎨 ศิลปิน' : '👤 ผู้ใช้งาน'}</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{profile.bio || 'ยังไม่มีคำอธิบายตัวเอง'}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-400">
                  {profile.location && (
                    <span className="flex items-center gap-1"><MapPin size={14} /> {profile.location}</span>
                  )}
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                      <LinkIcon size={14} /> {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  <span className="flex items-center gap-1"><Calendar size={14} /> เข้าร่วมเมื่อ {new Date(profile.createdAt?.seconds * 1000).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 bg-[#1a1a1a] p-6 rounded-2xl border border-[#2a2a2a] text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 uppercase">ชื่อที่แสดง</label>
                    <input 
                      type="text" 
                      value={editForm.displayName} 
                      onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                      className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 uppercase">ที่อยู่</label>
                    <input 
                      type="text" 
                      value={editForm.location} 
                      onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 uppercase">เว็บไซต์</label>
                  <input 
                    type="text" 
                    value={editForm.website} 
                    onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                    className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 uppercase">ประวัติส่วนตัว</label>
                  <textarea 
                    value={editForm.bio} 
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    rows="3"
                    className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">ยกเลิก</button>
                  <button onClick={handleSaveProfile} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-bold transition flex items-center gap-2">
                    <Save size={16} /> บันทึกข้อมูล
                  </button>
                </div>
              </div>
            )}

            {/* Credits Display */}
            {isOwnProfile && (
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl border border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                    <CreditCard size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">เครดิตคงเหลือ</p>
                    <p className="text-xl font-bold text-purple-400">{profile.credits || 0} เครดิต</p>
                  </div>
                </div>
                <Link to="/credits" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-sm font-bold transition">
                  เติมเงิน
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-[#2a2a2a] mb-8">
          <div className="flex justify-center gap-12">
            <button 
              onClick={() => setActiveTab('artworks')}
              className={`flex items-center gap-2 py-4 border-t-2 transition ${activeTab === 'artworks' ? 'border-white text-white' : 'border-transparent text-gray-500'}`}
            >
              <Grid size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">ผลงานศิลปะ</span>
            </button>
            <button 
              onClick={() => setActiveTab('stories')}
              className={`flex items-center gap-2 py-4 border-t-2 transition ${activeTab === 'stories' ? 'border-white text-white' : 'border-transparent text-gray-500'}`}
            >
              <BookOpen size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">นิยาย</span>
            </button>
            <button 
              onClick={() => setActiveTab('about')}
              className={`flex items-center gap-2 py-4 border-t-2 transition ${activeTab === 'about' ? 'border-white text-white' : 'border-transparent text-gray-500'}`}
            >
              <Award size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">เกี่ยวกับ</span>
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {activeTab === 'artworks' && (
            artworks.length > 0 ? (
              artworks.map((art) => (
                <Link 
                  key={art.id} 
                  to={`/artwork/${art.id}`}
                  className="relative aspect-square group overflow-hidden bg-[#1a1a1a]"
                >
                  <img src={art.imageUrl} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" alt="" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-6">
                    <div className="flex items-center gap-1 font-bold"><Heart size={20} fill="white" /> {art.likes || 0}</div>
                    <div className="flex items-center gap-1 font-bold"><MessageSquare size={20} fill="white" /> {art.comments || 0}</div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 py-20 text-center text-gray-500">
                <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
                <p>ยังไม่มีผลงานศิลปะ</p>
              </div>
            )
          )}

          {activeTab === 'stories' && (
            stories.length > 0 ? (
              stories.map((story) => (
                <Link 
                  key={story.id} 
                  to={`/story/${story.id}`}
                  className="relative aspect-[3/4] group overflow-hidden bg-[#1a1a1a] rounded-lg"
                >
                  <img src={story.coverImage} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" alt="" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center p-4 text-center">
                    <h4 className="font-bold mb-2 line-clamp-2">{story.title}</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-sm"><Star size={16} fill="white" /> {story.rating || 0}</div>
                      <div className="flex items-center gap-1 text-sm"><BookOpen size={16} /> {story.chapters || 0}</div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 py-20 text-center text-gray-500">
                <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                <p>ยังไม่มีนิยาย</p>
              </div>
            )
          )}

          {activeTab === 'about' && (
            <div className="col-span-3 bg-[#1a1a1a] rounded-2xl p-8 border border-[#2a2a2a]">
              <h3 className="text-xl font-bold mb-6">เกี่ยวกับ {profile.displayName}</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">บทบาท</p>
                    <p className="font-medium">{profile.role === 'artist' ? 'ศิลปิน (Artist)' : 'ผู้จ้างงาน (Client)'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">ทักษะ / ความถนัด</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.skills?.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-[#2a2a2a] rounded-full text-xs">{skill}</span>
                      )) || <p className="text-sm text-gray-500">ไม่ได้ระบุ</p>}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">สถิติการทำงาน</p>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="p-3 bg-[#2a2a2a] rounded-xl text-center">
                        <p className="text-xl font-bold text-green-400">{profile.completedJobs || 0}</p>
                        <p className="text-[10px] text-gray-400 uppercase">งานที่สำเร็จ</p>
                      </div>
                      <div className="p-3 bg-[#2a2a2a] rounded-xl text-center">
                        <p className="text-xl font-bold text-yellow-400">{profile.rating || '5.0'}</p>
                        <p className="text-[10px] text-gray-400 uppercase">คะแนนรีวิว</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
