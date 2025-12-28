import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { useSocial } from '../contexts/SocialContext';
import { useAuth } from '../contexts/AuthContext';

export default function SocialActions({ postId, postType = 'artwork', onCommentClick }) {
  const { currentUser } = useAuth();
  const { likePost, isLiked, getLikeCount, bookmarkPost, isBookmarked } = useSocial();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    loadSocialData();
  }, [postId, currentUser]);

  const loadSocialData = async () => {
    const [isLikedResult, count, isBookmarkedResult] = await Promise.all([
      isLiked(postId, postType),
      getLikeCount(postId, postType),
      isBookmarked(postId, postType)
    ]);
    setLiked(isLikedResult);
    setLikeCount(count);
    setBookmarked(isBookmarkedResult);
  };

  const handleLike = async () => {
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบเพื่อกดไลค์');
      return;
    }

    setLoading(true);
    const result = await likePost(postId, postType);
    setLiked(result);
    setLikeCount(prev => result ? prev + 1 : prev - 1);
    setLoading(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'VerseCanvas',
        text: 'ดูผลงานนี้บน VerseCanvas',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('คัดลอกลิงก์แล้ว!');
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบเพื่อบันทึก');
      return;
    }

    setBookmarkLoading(true);
    const result = await bookmarkPost(postId, postType);
    setBookmarked(result);
    setBookmarkLoading(false);
  };

  return (
    <div className="flex items-center gap-4">
      {/* Like Button */}
      <button
        onClick={handleLike}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${
          liked
            ? 'bg-pink-500/20 text-pink-500'
            : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] hover:text-white'
        }`}
      >
        <Heart
          size={20}
          className={liked ? 'fill-pink-500' : ''}
        />
        <span className="font-medium">{likeCount}</span>
      </button>

      {/* Comment Button */}
      <button
        onClick={onCommentClick}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] hover:text-white transition"
      >
        <MessageCircle size={20} />
        <span className="font-medium">แสดงความคิดเห็น</span>
      </button>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] hover:text-white transition"
      >
        <Share2 size={20} />
      </button>

      {/* Bookmark Button */}
      <button
        onClick={handleBookmark}
        disabled={bookmarkLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${
          bookmarked
            ? 'bg-yellow-500/20 text-yellow-500'
            : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] hover:text-white'
        }`}
      >
        <Bookmark
          size={20}
          className={bookmarked ? 'fill-yellow-500' : ''}
        />
      </button>
    </div>
  );
}
