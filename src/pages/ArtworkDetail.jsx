import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Eye, Heart, Calendar, Edit, Trash2, Bookmark } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocial } from '../contexts/SocialContext';
import SocialActions from '../components/SocialActions';
import CommentSection from '../components/CommentSection';
import FollowButton from '../components/FollowButton';
import UserAvatar from '../components/UserAvatar';
import { getDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, realtimeDb } from '../lib/firebase';
import { ref, get } from 'firebase/database';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const ArtworkDetail = () => {
  const { artworkId } = useParams();
  const { currentUser } = useAuth();
  const { incrementView, toggleBookmark, isBookmarked } = useSocial();
  
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (artworkId) {
      fetchArtworkDetail();
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
        window.location.href = '/artworks';
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
          <Link
            to="/artworks"
            className="px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition inline-block"
          >
            กลับไปยังผลงาน
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = currentUser && artwork.artistId === currentUser.uid;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <Link
          to="/artworks"
          className="inline-flex items-center gap-2 mb-6 text-gray-400 hover:text-purple-400 transition"
        >
          ← กลับไปหน้าผลงาน
        </Link>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Section */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border-2 border-[#2a2a2a] sticky top-8">
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={artwork.imageUrl || artwork.image || 'https://via.placeholder.com/600x600'}
                  alt={artwork.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6">
                <h1 className="text-2xl font-bold mb-2">{artwork.title}</h1>
                {artwork.category && (
                  <p className="text-sm text-gray-400 mb-4">{artwork.category}</p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-[#2a2a2a]">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-400">{formatNumber(likeCount)}</div>
                    <div className="text-xs text-gray-400">ไลค์</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{formatNumber(viewCount)}</div>
                    <div className="text-xs text-gray-400">วิว</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-400">{formatDate(artwork.createdAt)}</div>
                    <div className="text-xs text-gray-400">วันที่</div>
                  </div>
                </div>

                {/* Artist Info */}
                <Link 
                  to={`/profile/${artwork.artistId}`}
                  className="flex items-center gap-3 mb-6 pb-6 border-b border-[#2a2a2a] hover:opacity-80 transition group"
                >
                  <UserAvatar userId={artwork.artistId} className="w-12 h-12" />
                  <div className="flex-1">
                    <UserAvatar 
                      userId={artwork.artistId} 
                      showName={true} 
                      className="hidden" 
                      nameClassName="font-medium group-hover:text-purple-400 transition"
                    />
                    <p className="text-xs text-gray-400">ศิลปิน</p>
                  </div>
                </Link>

                {/* Follow Button */}
                {!isOwner && currentUser && (
                  <FollowButton userId={artwork.artistId} />
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  {isOwner && (
                    <>
                      <Link
                        to={`/artwork/${artworkId}/edit`}
                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-medium transition flex items-center justify-center gap-2"
                      >
                        <Edit size={18} />
                        แก้ไข
                      </Link>
                      <button
                        onClick={handleDelete}
                        className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 font-medium transition flex items-center justify-center gap-2"
                      >
                        <Trash2 size={18} />
                        ลบ
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowComments(true)}
                    className="w-full py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#3a3a3a] font-medium transition"
                  >
                    ดูความเห็น
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:col-span-2">
            {/* Description */}
            {artwork.description && (
              <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] mb-6">
                <h2 className="text-xl font-bold mb-4">รายละเอียด</h2>
                <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {artwork.description}
                </p>
              </div>
            )}

            {/* Social Actions */}
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] mb-6">
              <SocialActions
                postId={artworkId}
                postType="artwork"
                onCommentClick={() => setShowComments(true)}
              />
              <button
                onClick={handleBookmark}
                className={`mt-4 w-full py-3 rounded-lg border transition flex items-center justify-center gap-2 ${
                  bookmarked 
                    ? 'bg-purple-600/20 border-purple-500 text-purple-400' 
                    : 'bg-transparent border-[#3a3a3a] text-gray-400 hover:bg-[#2a2a2a]'
                }`}
              >
                <Bookmark size={20} fill={bookmarked ? "currentColor" : "none"} />
                {bookmarked ? 'ยกเลิกการบันทึก' : 'บันทึกรายการโปรด'}
              </button>
            </div>

            {/* Comments Section */}
            {showComments && (
              <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">ความเห็น</h2>
                  <button
                    onClick={() => setShowComments(false)}
                    className="text-gray-400 hover:text-white transition"
                  >
                    ✕
                  </button>
                </div>
                <CommentSection
                  postId={artworkId}
                  postType="artwork"
                  isOpen={showComments}
                  onClose={() => setShowComments(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtworkDetail;
