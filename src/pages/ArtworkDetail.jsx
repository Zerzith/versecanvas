import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, realtimeDb } from '../lib/firebase';
import { ref, get } from 'firebase/database';
import { Eye, Heart, Calendar, ArrowLeft, Edit, Trash2, Share2, Bookmark } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocial } from '../contexts/SocialContext';
import SocialActions from '../components/SocialActions';
import CommentSection from '../components/CommentSection';
import FollowButton from '../components/FollowButton';
import UserAvatar from '../components/UserAvatar';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const ArtworkDetail = ({ currentLanguage }) => {
  const { artworkId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { incrementView, toggleBookmark, isBookmarked } = useSocial();
  
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    fetchArtworkDetail();
    // เพิ่มยอดวิว
    if (artworkId) {
      incrementView(artworkId, 'artwork');
    }
  }, [artworkId]);

  useEffect(() => {
    if (artworkId && currentUser) {
      checkBookmarkStatus();
    }
  }, [artworkId, currentUser]);

  const checkBookmarkStatus = async () => {
    if (currentUser && artworkId) {
      const status = await isBookmarked(artworkId);
      setBookmarked(status);
    }
  };

  const fetchArtworkDetail = async () => {
    setLoading(true);
    try {
      // ดึงข้อมูลผลงานจาก Firestore
      const artworkDoc = await getDoc(doc(db, 'artworks', artworkId));
      if (artworkDoc.exists()) {
        const data = artworkDoc.data();
        setArtwork({
          id: artworkDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        });
      }

      // ดึงยอดวิว/ยอดใจจาก Realtime Database
      const viewRef = ref(realtimeDb, `views/artwork/${artworkId}`);
      const likeRef = ref(realtimeDb, `likeCounts/artwork/${artworkId}`);
      
      const [viewSnapshot, likeSnapshot] = await Promise.all([
        get(viewRef),
        get(likeRef)
      ]);
      
      setViewCount(viewSnapshot.exists() ? (viewSnapshot.val().count || 0) : 0);
      setLikeCount(likeSnapshot.exists() ? (likeSnapshot.val().count || 0) : 0);
    } catch (error) {
      console.error('Error fetching artwork:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!currentUser || !artwork) return;
    const result = await toggleBookmark(artworkId, 'artwork', {
      title: artwork.title,
      imageUrl: artwork.imageUrl || artwork.image,
      artistId: artwork.artistId
    });
    setBookmarked(result);
  };

  const handleDelete = async () => {
    if (!currentUser || artwork.artistId !== currentUser.uid) {
      alert('คุณไม่มีสิทธิ์ลบผลงานนี้');
      return;
    }

    if (window.confirm('คุณแน่ใจหรือว่าต้องการลบผลงานนี้?')) {
      try {
        await deleteDoc(doc(db, 'artworks', artworkId));
        alert('ลบผลงานสำเร็จ');
        navigate('/artworks');
      } catch (error) {
        console.error('Error deleting artwork:', error);
        alert('เกิดข้อผิดพลาดในการลบผลงาน');
      }
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (date) => {
    if (!date) return 'ไม่ระบุวันที่';
    try {
      return format(date, 'd MMMM yyyy', { locale: th });
    } catch (e) {
      return 'ไม่ระบุวันที่';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">ไม่พบผลงาน</p>
          <button
            onClick={() => navigate('/artworks')}
            className="px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition"
          >
            กลับไปยังผลงาน
          </button>
        </div>
      </div>
    );
  }

  const isOwner = currentUser && artwork.artistId === currentUser.uid;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-6 text-gray-400 hover:text-white transition"
        >
          <ArrowLeft size={20} />
          กลับ
        </button>

        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Image Section */}
          <div className="md:col-span-2">
            <div className="rounded-2xl overflow-hidden bg-[#1a1a1a] aspect-square md:aspect-auto">
              <img
                src={artwork.imageUrl || artwork.image || 'https://via.placeholder.com/600x600'}
                alt={artwork.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Details Section */}
          <div className="flex flex-col">
            {/* Title and Actions */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-4">{artwork.title}</h1>
              
              <div className="flex items-center gap-2 mb-4">
                {isOwner && (
                  <>
                    <Link
                      to={`/artwork/${artworkId}/edit`}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                    >
                      <Edit size={16} />
                      แก้ไข
                    </Link>
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                      ลบ
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Artist Info */}
            <div className="mb-6 pb-6 border-b border-[#2a2a2a]">
              <Link
                to={`/profile/${artwork.artistId}`}
                className="flex items-center gap-3 mb-4 hover:opacity-80 transition"
              >
                <UserAvatar 
                  userId={artwork.artistId} 
                  showName={true} 
                  className="w-12 h-12"
                  nameClassName="font-medium text-lg"
                />
              </Link>
              {!isOwner && currentUser && (
                <FollowButton userId={artwork.artistId} />
              )}
            </div>

            {/* Stats */}
            <div className="mb-6 pb-6 border-b border-[#2a2a2a]">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Heart size={18} className="text-pink-400" />
                  <span className="text-gray-400">
                    {formatNumber(likeCount)} ถูกใจ
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Eye size={18} className="text-blue-400" />
                  <span className="text-gray-400">
                    {formatNumber(viewCount)} เข้าชม
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-green-400" />
                  <span className="text-gray-400">
                    {formatDate(artwork.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {artwork.description && (
              <div className="mb-6 pb-6 border-b border-[#2a2a2a]">
                <h3 className="font-semibold mb-2">รายละเอียด</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {artwork.description}
                </p>
              </div>
            )}

            {/* Category and Tags */}
            {artwork.category && (
              <div className="mb-6 pb-6 border-b border-[#2a2a2a]">
                <h3 className="font-semibold mb-2">หมวดหมู่</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-purple-500/20 border border-purple-500 rounded-full text-sm text-purple-300">
                    {artwork.category}
                  </span>
                </div>
              </div>
            )}

            {/* Social Actions */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1">
                  <SocialActions
                    postId={artworkId}
                    postType="artwork"
                    onCommentClick={() => {}}
                  />
                </div>
                <button
                  onClick={handleBookmark}
                  className={`p-2 rounded-lg border transition ${
                    bookmarked 
                      ? 'bg-purple-600/20 border-purple-500 text-purple-400' 
                      : 'bg-transparent border-[#3a3a3a] text-gray-400 hover:bg-[#2a2a2a]'
                  }`}
                  title={bookmarked ? "ยกเลิกการบันทึก" : "บันทึกรายการโปรด"}
                >
                  <Bookmark size={20} fill={bookmarked ? "currentColor" : "none"} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-12 pt-8 border-t border-[#2a2a2a]">
          <h2 className="text-2xl font-bold mb-6">ความเห็น</h2>
          <CommentSection
            postId={artworkId}
            postType="artwork"
            isOpen={true}
            onClose={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export default ArtworkDetail;
